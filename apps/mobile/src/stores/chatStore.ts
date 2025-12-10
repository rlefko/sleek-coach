import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';
import type { ChatMessage, ChatSession, ToolTrace, DataGap } from '@/services/api/types';

// Performance constants
const MAX_MESSAGES_PER_SESSION = 200; // 100 rounds of conversation
const MAX_SESSIONS_TO_KEEP = 50;

/**
 * Generate a cryptographically secure unique ID
 */
function generateId(): string {
  const randomBytes = new Uint32Array(2);
  crypto.getRandomValues(randomBytes);
  return `${Date.now()}-${randomBytes[0].toString(36)}${randomBytes[1].toString(36)}`;
}

/**
 * Trim messages array to max limit using FIFO
 */
function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_MESSAGES_PER_SESSION) {
    return messages;
  }
  // Keep the most recent messages
  return messages.slice(-MAX_MESSAGES_PER_SESSION);
}

interface ChatState {
  // Sessions
  sessions: ChatSession[];
  currentSessionId: string | null;

  // Messages keyed by session ID
  messages: Record<string, ChatMessage[]>;

  // Streaming state
  streamingContent: string;
  isStreaming: boolean;
  streamingMessageId: string | null;
}

interface ChatActions {
  // Session management
  createSession: () => string;
  setCurrentSession: (sessionId: string | null) => void;
  updateSessionId: (oldId: string, newId: string) => void;
  clearSession: (sessionId: string) => void;
  clearAllSessions: () => void;

  // Message management
  addMessage: (message: Omit<ChatMessage, 'id'>) => string;
  updateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  setMessageToolTrace: (sessionId: string, messageId: string, toolTrace: ToolTrace[]) => void;
  setMessageMetadata: (
    sessionId: string,
    messageId: string,
    metadata: {
      confidence?: number;
      dataGaps?: DataGap[];
      disclaimers?: string[];
    }
  ) => void;

  // Streaming management
  startStreaming: (sessionId: string) => string;
  appendStreamingContent: (token: string) => void;
  completeStreaming: (finalContent?: string) => void;
  cancelStreaming: () => void;
  setStreamingError: (error: string) => void;

  // Helpers
  getSessionMessages: (sessionId: string) => ChatMessage[];
  getCurrentMessages: () => ChatMessage[];
}

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [],
      currentSessionId: null,
      messages: {},
      streamingContent: '',
      isStreaming: false,
      streamingMessageId: null,

      // Session management
      createSession: () => {
        const sessionId = generateId();
        const now = new Date().toISOString();

        const newSession: ChatSession = {
          id: sessionId,
          created_at: now,
          last_message_at: now,
          message_count: 0,
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: sessionId,
          messages: {
            ...state.messages,
            [sessionId]: [],
          },
        }));

        return sessionId;
      },

      setCurrentSession: (sessionId) => {
        set({ currentSessionId: sessionId });
      },

      updateSessionId: (oldId, newId) => {
        set((state) => {
          const oldMessages = state.messages[oldId] || [];
          const newMessages = { ...state.messages };
          delete newMessages[oldId];
          newMessages[newId] = oldMessages.map((m) => ({
            ...m,
            sessionId: newId,
          }));

          const sessions = state.sessions.map((s) => (s.id === oldId ? { ...s, id: newId } : s));

          return {
            sessions,
            messages: newMessages,
            currentSessionId: state.currentSessionId === oldId ? newId : state.currentSessionId,
          };
        });
      },

      clearSession: (sessionId) => {
        set((state) => {
          const newMessages = { ...state.messages };
          delete newMessages[sessionId];

          return {
            sessions: state.sessions.filter((s) => s.id !== sessionId),
            messages: newMessages,
            currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
          };
        });
      },

      clearAllSessions: () => {
        set({
          sessions: [],
          currentSessionId: null,
          messages: {},
          streamingContent: '',
          isStreaming: false,
          streamingMessageId: null,
        });
      },

      // Message management
      addMessage: (messageData) => {
        const messageId = generateId();
        const message: ChatMessage = {
          ...messageData,
          id: messageId,
        };

        set((state) => {
          const sessionMessages = state.messages[message.sessionId] || [];
          const session = state.sessions.find((s) => s.id === message.sessionId);

          // Add new message and trim to max limit
          const updatedMessages = trimMessages([...sessionMessages, message]);

          return {
            messages: {
              ...state.messages,
              [message.sessionId]: updatedMessages,
            },
            sessions: state.sessions.map((s) =>
              s.id === message.sessionId
                ? {
                    ...s,
                    last_message_at: message.timestamp,
                    message_count: (session?.message_count || 0) + 1,
                  }
                : s
            ),
          };
        });

        return messageId;
      },

      updateMessage: (sessionId, messageId, updates) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [sessionId]: (state.messages[sessionId] || []).map((m) =>
              m.id === messageId ? { ...m, ...updates } : m
            ),
          },
        }));
      },

      setMessageToolTrace: (sessionId, messageId, toolTrace) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [sessionId]: (state.messages[sessionId] || []).map((m) =>
              m.id === messageId ? { ...m, toolTrace } : m
            ),
          },
        }));
      },

      setMessageMetadata: (sessionId, messageId, metadata) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [sessionId]: (state.messages[sessionId] || []).map((m) =>
              m.id === messageId ? { ...m, ...metadata } : m
            ),
          },
        }));
      },

      // Streaming management
      startStreaming: (sessionId) => {
        const messageId = generateId();
        const now = new Date().toISOString();

        const streamingMessage: ChatMessage = {
          id: messageId,
          role: 'assistant',
          content: '',
          timestamp: now,
          sessionId,
          status: 'streaming',
        };

        set((state) => ({
          messages: {
            ...state.messages,
            [sessionId]: [...(state.messages[sessionId] || []), streamingMessage],
          },
          streamingContent: '',
          isStreaming: true,
          streamingMessageId: messageId,
        }));

        return messageId;
      },

      appendStreamingContent: (token) => {
        set((state) => {
          const newContent = state.streamingContent + token;
          const sessionId = state.currentSessionId;
          const messageId = state.streamingMessageId;

          if (!sessionId || !messageId) {
            return { streamingContent: newContent };
          }

          return {
            streamingContent: newContent,
            messages: {
              ...state.messages,
              [sessionId]: (state.messages[sessionId] || []).map((m) =>
                m.id === messageId ? { ...m, content: newContent } : m
              ),
            },
          };
        });
      },

      completeStreaming: (finalContent) => {
        set((state) => {
          const sessionId = state.currentSessionId;
          const messageId = state.streamingMessageId;
          const content = finalContent ?? state.streamingContent;

          if (!sessionId || !messageId) {
            return {
              streamingContent: '',
              isStreaming: false,
              streamingMessageId: null,
            };
          }

          return {
            streamingContent: '',
            isStreaming: false,
            streamingMessageId: null,
            messages: {
              ...state.messages,
              [sessionId]: (state.messages[sessionId] || []).map((m) =>
                m.id === messageId ? { ...m, content, status: 'complete' as const } : m
              ),
            },
          };
        });
      },

      cancelStreaming: () => {
        set((state) => {
          const sessionId = state.currentSessionId;
          const messageId = state.streamingMessageId;

          if (!sessionId || !messageId) {
            return {
              streamingContent: '',
              isStreaming: false,
              streamingMessageId: null,
            };
          }

          // Remove the incomplete streaming message
          return {
            streamingContent: '',
            isStreaming: false,
            streamingMessageId: null,
            messages: {
              ...state.messages,
              [sessionId]: (state.messages[sessionId] || []).filter((m) => m.id !== messageId),
            },
          };
        });
      },

      setStreamingError: (error) => {
        set((state) => {
          const sessionId = state.currentSessionId;
          const messageId = state.streamingMessageId;

          if (!sessionId || !messageId) {
            return {
              streamingContent: '',
              isStreaming: false,
              streamingMessageId: null,
            };
          }

          return {
            streamingContent: '',
            isStreaming: false,
            streamingMessageId: null,
            messages: {
              ...state.messages,
              [sessionId]: (state.messages[sessionId] || []).map((m) =>
                m.id === messageId ? { ...m, status: 'error' as const, errorMessage: error } : m
              ),
            },
          };
        });
      },

      // Helpers
      getSessionMessages: (sessionId) => {
        return get().messages[sessionId] || [];
      },

      getCurrentMessages: () => {
        const { currentSessionId, messages } = get();
        return currentSessionId ? messages[currentSessionId] || [] : [];
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => {
        // Trim sessions to limit
        const trimmedSessions = state.sessions.slice(0, MAX_SESSIONS_TO_KEEP);
        const sessionIds = new Set(trimmedSessions.map((s) => s.id));

        // Only keep messages for retained sessions, and trim each to limit
        const trimmedMessages: Record<string, ChatMessage[]> = {};
        for (const [sessionId, msgs] of Object.entries(state.messages)) {
          if (sessionIds.has(sessionId)) {
            trimmedMessages[sessionId] = trimMessages(msgs);
          }
        }

        return {
          sessions: trimmedSessions,
          messages: trimmedMessages,
          currentSessionId: state.currentSessionId,
        };
      },
    }
  )
);
