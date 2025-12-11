import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coachService } from '../api';
import { queryKeys } from '@/lib/queryKeys';
import { useChatStore } from '@/stores/chatStore';
import type { WeeklyPlanRequest, StreamEvent } from '../api/types';

/**
 * Hook for fetching coach insights
 */
export const useInsights = () => {
  return useQuery({
    queryKey: queryKeys.coach.insights(),
    queryFn: coachService.getInsights,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook for fetching current weekly plan
 */
export const usePlan = () => {
  return useQuery({
    queryKey: queryKeys.coach.plan(),
    queryFn: coachService.getPlan,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });
};

/**
 * Hook for generating a new weekly plan
 */
export const useGeneratePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request?: WeeklyPlanRequest) => coachService.generatePlan(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coach.plan() });
    },
  });
};

/**
 * Hook for non-streaming chat (single response)
 */
export const useChat = () => {
  const chatStore = useChatStore();

  return useMutation({
    mutationFn: async ({ message, sessionId }: { message: string; sessionId?: string }) => {
      // Get or create session
      const currentSessionId = sessionId || chatStore.currentSessionId || chatStore.createSession();

      // Add user message
      chatStore.addMessage({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        sessionId: currentSessionId,
        status: 'complete',
      });

      // Send to API
      const response = await coachService.chat({
        message,
        session_id: currentSessionId,
      });

      // Update session ID if different (server-generated)
      if (response.session_id !== currentSessionId) {
        chatStore.updateSessionId(currentSessionId, response.session_id);
      }

      // Add assistant message
      chatStore.addMessage({
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        sessionId: response.session_id,
        status: 'complete',
        toolTrace: response.tool_trace || undefined,
        confidence: response.confidence,
        dataGaps: response.data_gaps || undefined,
        disclaimers: response.disclaimers || undefined,
      });

      return response;
    },
  });
};

/**
 * Hook for streaming chat with SSE
 */
export const useChatStream = () => {
  const chatStore = useChatStore();

  const sendMessage = useCallback(
    async (message: string, sessionId?: string) => {
      // Get or create session
      const currentSessionId = sessionId || chatStore.currentSessionId || chatStore.createSession();

      // Set current session
      chatStore.setCurrentSession(currentSessionId);

      // Add user message
      chatStore.addMessage({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        sessionId: currentSessionId,
        status: 'complete',
      });

      // Start streaming (creates placeholder assistant message)
      const streamingMessageId = chatStore.startStreaming(currentSessionId);

      let serverSessionId = sessionId;
      const toolTraces: StreamEvent['data'][] = [];

      try {
        for await (const event of coachService.chatStream({
          message,
          session_id: currentSessionId,
        })) {
          switch (event.type) {
            case 'token':
              chatStore.appendStreamingContent(event.data as string);
              break;

            case 'tool_start':
              // Could show tool indicator in UI
              toolTraces.push(event.data);
              break;

            case 'tool_end':
              // Update tool trace
              break;

            case 'done': {
              const doneData = event.data as Record<string, unknown>;
              serverSessionId = (doneData.session_id as string) || serverSessionId;

              // Complete streaming
              chatStore.completeStreaming();

              // Update with final metadata if provided
              if (doneData.confidence !== undefined || doneData.tool_trace) {
                chatStore.setMessageMetadata(currentSessionId, streamingMessageId, {
                  confidence: doneData.confidence as number | undefined,
                  dataGaps: doneData.data_gaps as undefined,
                  disclaimers: doneData.disclaimers as string[] | undefined,
                });
              }

              // Update session ID if different
              if (serverSessionId && serverSessionId !== currentSessionId) {
                chatStore.updateSessionId(currentSessionId, serverSessionId);
              }
              break;
            }

            case 'error':
              chatStore.setStreamingError(event.data as string);
              return;
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to connect. Please try again.';
        chatStore.setStreamingError(errorMessage);
      }
    },
    [chatStore]
  );

  const cancel = useCallback(() => {
    chatStore.cancelStreaming();
  }, [chatStore]);

  return {
    sendMessage,
    cancel,
    isStreaming: chatStore.isStreaming,
    streamingContent: chatStore.streamingContent,
  };
};

/**
 * Hook for managing chat sessions
 */
export const useChatSessions = () => {
  const chatStore = useChatStore();

  return {
    sessions: chatStore.sessions,
    currentSessionId: chatStore.currentSessionId,
    createSession: chatStore.createSession,
    setCurrentSession: chatStore.setCurrentSession,
    clearSession: chatStore.clearSession,
    clearAllSessions: chatStore.clearAllSessions,
    getCurrentMessages: chatStore.getCurrentMessages,
    getSessionMessages: chatStore.getSessionMessages,
  };
};
