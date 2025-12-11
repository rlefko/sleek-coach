import React, { createRef } from 'react';
import { waitFor } from '@testing-library/react-native';
import { render } from '../../test-utils';
import { MessageList, MessageListRef } from '@/components/coach/MessageList';
import type { ChatMessage } from '@/services/api/types';

const createMockMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: `msg-${Date.now()}-${Math.random()}`,
  role: 'user',
  content: 'Test message',
  timestamp: new Date().toISOString(),
  sessionId: 'test-session',
  status: 'complete',
  ...overrides,
});

describe('MessageList', () => {
  const mockOnRetryMessage = jest.fn();
  const mockOnScrollPositionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders empty state when no messages and not streaming', () => {
      const { getByText } = render(<MessageList messages={[]} isStreaming={false} />);

      expect(getByText('Chat with Your Coach')).toBeTruthy();
    });

    it('renders messages when provided', () => {
      const messages: ChatMessage[] = [
        createMockMessage({ id: '1', content: 'Hello coach', role: 'user' }),
        createMockMessage({ id: '2', content: 'Hi there!', role: 'assistant' }),
      ];

      const { getByText } = render(<MessageList messages={messages} isStreaming={false} />);

      expect(getByText('Hello coach')).toBeTruthy();
      expect(getByText('Hi there!')).toBeTruthy();
    });

    it('shows typing indicator when streaming and last message is from user', () => {
      const messages: ChatMessage[] = [
        createMockMessage({ id: '1', content: 'Hello', role: 'user' }),
      ];

      const { getByTestId } = render(<MessageList messages={messages} isStreaming={true} />);

      expect(getByTestId('typing-indicator')).toBeTruthy();
    });

    it('shows typing indicator when streaming with no messages', () => {
      const { getByTestId } = render(<MessageList messages={[]} isStreaming={true} />);

      expect(getByTestId('typing-indicator')).toBeTruthy();
    });

    it('does not show typing indicator when last message is from assistant', () => {
      const messages: ChatMessage[] = [
        createMockMessage({ id: '1', content: 'Hello', role: 'user' }),
        createMockMessage({ id: '2', content: 'Response', role: 'assistant' }),
      ];

      const { queryByTestId } = render(<MessageList messages={messages} isStreaming={true} />);

      expect(queryByTestId('typing-indicator')).toBeNull();
    });
  });

  describe('scroll position callback', () => {
    it('calls onScrollPositionChange with initial value', async () => {
      const messages: ChatMessage[] = [createMockMessage({ id: '1', content: 'Test' })];

      render(
        <MessageList
          messages={messages}
          isStreaming={false}
          onScrollPositionChange={mockOnScrollPositionChange}
        />
      );

      await waitFor(() => {
        expect(mockOnScrollPositionChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('imperative handle', () => {
    it('exposes scrollToEnd method via ref', () => {
      const ref = createRef<MessageListRef>();
      const messages: ChatMessage[] = [createMockMessage({ id: '1', content: 'Test' })];

      render(<MessageList ref={ref} messages={messages} isStreaming={false} />);

      expect(ref.current).toBeTruthy();
      expect(ref.current?.scrollToEnd).toBeDefined();
      expect(typeof ref.current?.scrollToEnd).toBe('function');
    });

    it('scrollToEnd can be called without error', () => {
      const ref = createRef<MessageListRef>();
      const messages: ChatMessage[] = [createMockMessage({ id: '1', content: 'Test' })];

      render(<MessageList ref={ref} messages={messages} isStreaming={false} />);

      expect(() => ref.current?.scrollToEnd(true)).not.toThrow();
      expect(() => ref.current?.scrollToEnd(false)).not.toThrow();
    });
  });

  describe('retry functionality', () => {
    it('passes onRetry callback for error messages', () => {
      const messages: ChatMessage[] = [
        createMockMessage({
          id: '1',
          content: 'Failed message',
          status: 'error',
          errorMessage: 'Network error',
        }),
      ];

      const { getByText } = render(
        <MessageList messages={messages} isStreaming={false} onRetryMessage={mockOnRetryMessage} />
      );

      expect(getByText('Failed message')).toBeTruthy();
    });
  });

  describe('ListHeaderComponent', () => {
    it('renders ListHeaderComponent when provided', () => {
      const messages: ChatMessage[] = [createMockMessage({ id: '1', content: 'Test' })];

      const { getByText } = render(
        <MessageList messages={messages} isStreaming={false} ListHeaderComponent={<></>} />
      );

      expect(getByText('Test')).toBeTruthy();
    });
  });
});
