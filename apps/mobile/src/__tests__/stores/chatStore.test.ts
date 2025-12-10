import { useChatStore } from '@/stores/chatStore';

// Storage is mocked globally in jest.setup.js

describe('chatStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    const { clearAllSessions } = useChatStore.getState();
    clearAllSessions();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { clearAllSessions } = useChatStore.getState();
      clearAllSessions();

      const state = useChatStore.getState();
      expect(state.sessions).toEqual([]);
      expect(state.currentSessionId).toBeNull();
      expect(state.messages).toEqual({});
      expect(state.streamingContent).toBe('');
      expect(state.isStreaming).toBe(false);
      expect(state.streamingMessageId).toBeNull();
    });
  });

  describe('session management', () => {
    it('creates new session with unique ID and current timestamp', () => {
      const { createSession } = useChatStore.getState();

      const sessionId = createSession();

      const state = useChatStore.getState();
      expect(sessionId).toBeTruthy();
      expect(state.sessions).toHaveLength(1);
      expect(state.sessions[0].id).toBe(sessionId);
      expect(state.sessions[0].created_at).toBeTruthy();
      expect(state.sessions[0].last_message_at).toBeTruthy();
      expect(state.sessions[0].message_count).toBe(0);
      expect(state.currentSessionId).toBe(sessionId);
      expect(state.messages[sessionId]).toEqual([]);
    });

    it('creates multiple sessions with different IDs', () => {
      const { createSession } = useChatStore.getState();

      const sessionId1 = createSession();
      const sessionId2 = createSession();

      expect(sessionId1).not.toBe(sessionId2);
      const state = useChatStore.getState();
      expect(state.sessions).toHaveLength(2);
    });

    it('sets current session correctly', () => {
      const { createSession, setCurrentSession } = useChatStore.getState();

      const sessionId1 = createSession();
      createSession(); // Create second session to test switching

      setCurrentSession(sessionId1);

      expect(useChatStore.getState().currentSessionId).toBe(sessionId1);

      setCurrentSession(null);
      expect(useChatStore.getState().currentSessionId).toBeNull();
    });

    it('updates session ID and remaps messages', () => {
      const { createSession, addMessage, updateSessionId } = useChatStore.getState();

      const oldId = createSession();
      addMessage({
        role: 'user',
        content: 'Test message',
        timestamp: new Date().toISOString(),
        sessionId: oldId,
        status: 'complete',
      });

      const newId = 'new-server-id';
      updateSessionId(oldId, newId);

      const state = useChatStore.getState();
      expect(state.sessions[0].id).toBe(newId);
      expect(state.messages[newId]).toHaveLength(1);
      expect(state.messages[newId][0].sessionId).toBe(newId);
      expect(state.messages[oldId]).toBeUndefined();
      expect(state.currentSessionId).toBe(newId);
    });

    it('clears single session and removes associated messages', () => {
      const { createSession, addMessage, clearSession } = useChatStore.getState();

      const sessionId1 = createSession();
      const sessionId2 = createSession();

      addMessage({
        role: 'user',
        content: 'Message in session 1',
        timestamp: new Date().toISOString(),
        sessionId: sessionId1,
        status: 'complete',
      });

      clearSession(sessionId1);

      const state = useChatStore.getState();
      expect(state.sessions).toHaveLength(1);
      expect(state.sessions[0].id).toBe(sessionId2);
      expect(state.messages[sessionId1]).toBeUndefined();
    });

    it('clears all sessions and resets state', () => {
      const { createSession, addMessage, clearAllSessions } = useChatStore.getState();

      const sessionId = createSession();
      addMessage({
        role: 'user',
        content: 'Test',
        timestamp: new Date().toISOString(),
        sessionId,
        status: 'complete',
      });

      clearAllSessions();

      const state = useChatStore.getState();
      expect(state.sessions).toEqual([]);
      expect(state.currentSessionId).toBeNull();
      expect(state.messages).toEqual({});
      expect(state.streamingContent).toBe('');
      expect(state.isStreaming).toBe(false);
      expect(state.streamingMessageId).toBeNull();
    });
  });

  describe('message management', () => {
    it('adds message with generated ID', () => {
      const { createSession, addMessage } = useChatStore.getState();

      const sessionId = createSession();
      const messageId = addMessage({
        role: 'user',
        content: 'Hello coach',
        timestamp: new Date().toISOString(),
        sessionId,
        status: 'complete',
      });

      expect(messageId).toBeTruthy();
      const state = useChatStore.getState();
      expect(state.messages[sessionId]).toHaveLength(1);
      expect(state.messages[sessionId][0].id).toBe(messageId);
      expect(state.messages[sessionId][0].content).toBe('Hello coach');
      expect(state.messages[sessionId][0].role).toBe('user');
    });

    it('updates session message count and last_message_at', () => {
      const { createSession, addMessage } = useChatStore.getState();

      const sessionId = createSession();
      const timestamp = new Date().toISOString();

      addMessage({
        role: 'user',
        content: 'First message',
        timestamp,
        sessionId,
        status: 'complete',
      });

      const state = useChatStore.getState();
      expect(state.sessions[0].message_count).toBe(1);
      expect(state.sessions[0].last_message_at).toBe(timestamp);
    });

    it('updates specific message by ID', () => {
      const { createSession, addMessage, updateMessage } = useChatStore.getState();

      const sessionId = createSession();
      const messageId = addMessage({
        role: 'assistant',
        content: 'Original content',
        timestamp: new Date().toISOString(),
        sessionId,
        status: 'complete',
      });

      updateMessage(sessionId, messageId, { content: 'Updated content' });

      const state = useChatStore.getState();
      expect(state.messages[sessionId][0].content).toBe('Updated content');
    });

    it('sets tool trace on message', () => {
      const { createSession, addMessage, setMessageToolTrace } = useChatStore.getState();

      const sessionId = createSession();
      const messageId = addMessage({
        role: 'assistant',
        content: 'Response',
        timestamp: new Date().toISOString(),
        sessionId,
        status: 'complete',
      });

      const toolTrace = [
        {
          tool_name: 'get_user_profile',
          tool_description: 'Retrieved user profile',
          input_summary: '{}',
          output_summary: '{"name": "John"}',
          source_citations: null,
          latency_ms: 100,
          cached: false,
        },
      ];

      setMessageToolTrace(sessionId, messageId, toolTrace);

      const state = useChatStore.getState();
      expect(state.messages[sessionId][0].toolTrace).toEqual(toolTrace);
    });

    it('sets metadata (confidence, dataGaps, disclaimers) on message', () => {
      const { createSession, addMessage, setMessageMetadata } = useChatStore.getState();

      const sessionId = createSession();
      const messageId = addMessage({
        role: 'assistant',
        content: 'Response',
        timestamp: new Date().toISOString(),
        sessionId,
        status: 'complete',
      });

      const metadata = {
        confidence: 0.85,
        dataGaps: [
          { field: 'weight', description: 'Missing weight data', suggestion: 'Log your weight' },
        ],
        disclaimers: ['This is not medical advice'],
      };

      setMessageMetadata(sessionId, messageId, metadata);

      const state = useChatStore.getState();
      expect(state.messages[sessionId][0].confidence).toBe(0.85);
      expect(state.messages[sessionId][0].dataGaps).toEqual(metadata.dataGaps);
      expect(state.messages[sessionId][0].disclaimers).toEqual(metadata.disclaimers);
    });
  });

  describe('streaming', () => {
    it('starts streaming with placeholder assistant message', () => {
      const { createSession, startStreaming } = useChatStore.getState();

      const sessionId = createSession();
      const messageId = startStreaming(sessionId);

      const state = useChatStore.getState();
      expect(messageId).toBeTruthy();
      expect(state.isStreaming).toBe(true);
      expect(state.streamingMessageId).toBe(messageId);
      expect(state.streamingContent).toBe('');
      expect(state.messages[sessionId]).toHaveLength(1);
      expect(state.messages[sessionId][0].role).toBe('assistant');
      expect(state.messages[sessionId][0].content).toBe('');
      expect(state.messages[sessionId][0].status).toBe('streaming');
    });

    it('appends streaming content and updates message', () => {
      const { createSession, startStreaming, appendStreamingContent } = useChatStore.getState();

      const sessionId = createSession();
      startStreaming(sessionId);

      appendStreamingContent('Hello');
      expect(useChatStore.getState().streamingContent).toBe('Hello');
      expect(useChatStore.getState().messages[sessionId][0].content).toBe('Hello');

      appendStreamingContent(' world');
      expect(useChatStore.getState().streamingContent).toBe('Hello world');
      expect(useChatStore.getState().messages[sessionId][0].content).toBe('Hello world');
    });

    it('handles append when no session is active', () => {
      const { appendStreamingContent } = useChatStore.getState();

      // Should not throw
      appendStreamingContent('test');

      const state = useChatStore.getState();
      expect(state.streamingContent).toBe('test');
    });

    it('completes streaming with final content', () => {
      const { createSession, startStreaming, appendStreamingContent, completeStreaming } =
        useChatStore.getState();

      const sessionId = createSession();
      startStreaming(sessionId);
      appendStreamingContent('Partial content');

      completeStreaming('Final content');

      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(false);
      expect(state.streamingMessageId).toBeNull();
      expect(state.streamingContent).toBe('');
      expect(state.messages[sessionId][0].content).toBe('Final content');
      expect(state.messages[sessionId][0].status).toBe('complete');
    });

    it('completes streaming with accumulated content when no final provided', () => {
      const { createSession, startStreaming, appendStreamingContent, completeStreaming } =
        useChatStore.getState();

      const sessionId = createSession();
      startStreaming(sessionId);
      appendStreamingContent('Accumulated');

      completeStreaming();

      const state = useChatStore.getState();
      expect(state.messages[sessionId][0].content).toBe('Accumulated');
      expect(state.messages[sessionId][0].status).toBe('complete');
    });

    it('cancels streaming and removes incomplete message', () => {
      const { createSession, startStreaming, appendStreamingContent, cancelStreaming } =
        useChatStore.getState();

      const sessionId = createSession();
      startStreaming(sessionId);
      appendStreamingContent('Partial');

      cancelStreaming();

      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(false);
      expect(state.streamingMessageId).toBeNull();
      expect(state.streamingContent).toBe('');
      expect(state.messages[sessionId]).toHaveLength(0);
    });

    it('sets streaming error and marks message with error status', () => {
      const { createSession, startStreaming, setStreamingError } = useChatStore.getState();

      const sessionId = createSession();
      startStreaming(sessionId);

      setStreamingError('Network error');

      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(false);
      expect(state.streamingMessageId).toBeNull();
      expect(state.messages[sessionId][0].status).toBe('error');
      expect(state.messages[sessionId][0].errorMessage).toBe('Network error');
    });
  });

  describe('helpers', () => {
    it('returns empty array for non-existent session', () => {
      const { getSessionMessages } = useChatStore.getState();

      const messages = getSessionMessages('non-existent-id');

      expect(messages).toEqual([]);
    });

    it('returns session messages correctly', () => {
      const { createSession, addMessage, getSessionMessages } = useChatStore.getState();

      const sessionId = createSession();
      addMessage({
        role: 'user',
        content: 'Test',
        timestamp: new Date().toISOString(),
        sessionId,
        status: 'complete',
      });

      const messages = getSessionMessages(sessionId);

      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Test');
    });

    it('returns current session messages correctly', () => {
      const { createSession, addMessage, getCurrentMessages } = useChatStore.getState();

      const sessionId = createSession();
      addMessage({
        role: 'user',
        content: 'Current session message',
        timestamp: new Date().toISOString(),
        sessionId,
        status: 'complete',
      });

      const messages = getCurrentMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Current session message');
    });

    it('returns empty array when no current session', () => {
      const { setCurrentSession, getCurrentMessages } = useChatStore.getState();

      setCurrentSession(null);

      const messages = getCurrentMessages();

      expect(messages).toEqual([]);
    });
  });
});
