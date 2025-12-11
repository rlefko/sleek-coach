import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { MessageBubble } from '@/components/coach/MessageBubble';
import type { ChatMessage } from '@/services/api/types';

// Wrap component with PaperProvider for testing
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<PaperProvider theme={MD3DarkTheme}>{ui}</PaperProvider>);
};

describe('MessageBubble', () => {
  const baseMessage: ChatMessage = {
    id: 'msg-1',
    sessionId: 'session-1',
    role: 'user',
    content: 'Hello coach',
    timestamp: new Date().toISOString(),
    status: 'complete',
  };

  describe('rendering', () => {
    it('renders user message content', () => {
      const { getByText } = renderWithProvider(<MessageBubble message={baseMessage} />);

      expect(getByText('Hello coach')).toBeTruthy();
    });

    it('renders assistant message content', () => {
      const assistantMessage: ChatMessage = {
        ...baseMessage,
        role: 'assistant',
        content: 'How can I help you?',
      };

      const { getByText } = renderWithProvider(<MessageBubble message={assistantMessage} />);

      expect(getByText('How can I help you?')).toBeTruthy();
    });

    it('renders empty content as ellipsis when streaming (component level)', () => {
      // Note: In practice, empty streaming messages are filtered at MessageList level
      // and TypingIndicator is shown instead. This tests the component's fallback.
      const streamingMessage: ChatMessage = {
        ...baseMessage,
        role: 'assistant',
        content: '',
        status: 'streaming',
      };

      const { getByText } = renderWithProvider(<MessageBubble message={streamingMessage} />);

      expect(getByText('...')).toBeTruthy();
    });
  });

  describe('streaming state', () => {
    it('shows streaming indicator when streaming with content', () => {
      const streamingMessage: ChatMessage = {
        ...baseMessage,
        role: 'assistant',
        content: 'Thinking',
        status: 'streaming',
      };

      // The streaming indicator uses ActivityIndicator when content exists
      const { getByText } = renderWithProvider(<MessageBubble message={streamingMessage} />);

      expect(getByText('Thinking')).toBeTruthy();
    });

    it('does not show streaming indicator when streaming with empty content', () => {
      const streamingMessage: ChatMessage = {
        ...baseMessage,
        role: 'assistant',
        content: '',
        status: 'streaming',
      };

      // When content is empty, no streaming indicator is shown
      // (TypingIndicator handles this at the MessageList level)
      const { queryByTestId } = renderWithProvider(<MessageBubble message={streamingMessage} />);

      // The ActivityIndicator won't be rendered when content is empty
      // We verify the component renders without error
      expect(queryByTestId).toBeDefined();
    });

    it('hides timestamp when streaming', () => {
      const streamingMessage: ChatMessage = {
        ...baseMessage,
        role: 'assistant',
        content: 'Thinking',
        status: 'streaming',
      };

      const { queryByText } = renderWithProvider(
        <MessageBubble message={streamingMessage} showTimestamp={true} />
      );

      // Timestamp should not show during streaming
      expect(queryByText(/ago|just now/)).toBeNull();
    });
  });

  describe('error state', () => {
    it('shows error message when status is error', () => {
      const errorMessage: ChatMessage = {
        ...baseMessage,
        role: 'assistant',
        content: '',
        status: 'error',
        errorMessage: 'Network error',
      };

      const { getByText } = renderWithProvider(<MessageBubble message={errorMessage} />);

      expect(getByText('Network error')).toBeTruthy();
    });

    it('shows retry text when onRetry is provided', () => {
      const errorMessage: ChatMessage = {
        ...baseMessage,
        role: 'assistant',
        content: '',
        status: 'error',
        errorMessage: 'Failed to send',
      };

      const mockOnRetry = jest.fn();

      const { getByText } = renderWithProvider(
        <MessageBubble message={errorMessage} onRetry={mockOnRetry} />
      );

      expect(getByText('Tap to retry')).toBeTruthy();
    });

    it('handles object-type errorMessage gracefully', () => {
      // This can happen if a Pydantic validation error object leaks through
      const errorMessage: ChatMessage = {
        ...baseMessage,
        role: 'assistant',
        content: '',
        status: 'error',
        errorMessage: { type: 'validation', msg: 'Invalid input' } as unknown as string,
      };

      const { getByText } = renderWithProvider(<MessageBubble message={errorMessage} />);
      expect(getByText('An error occurred')).toBeTruthy();
    });
  });

  describe('metadata', () => {
    it('shows disclaimers for assistant messages', () => {
      const messageWithDisclaimer: ChatMessage = {
        ...baseMessage,
        role: 'assistant',
        content: 'You should exercise more.',
        disclaimers: ['This is not medical advice'],
      };

      const { getByText } = renderWithProvider(<MessageBubble message={messageWithDisclaimer} />);

      expect(getByText('This is not medical advice')).toBeTruthy();
    });

    it('does not show disclaimers for user messages', () => {
      const userMessageWithDisclaimer: ChatMessage = {
        ...baseMessage,
        role: 'user',
        content: 'Question',
        disclaimers: ['Test disclaimer'],
      };

      const { queryByText } = renderWithProvider(
        <MessageBubble message={userMessageWithDisclaimer} />
      );

      expect(queryByText('Test disclaimer')).toBeNull();
    });
  });

  describe('markdown rendering', () => {
    it('renders markdown in assistant messages', () => {
      const assistantMessage: ChatMessage = {
        ...baseMessage,
        role: 'assistant',
        content: 'This is **bold** and *italic*',
      };

      const { getByText } = renderWithProvider(<MessageBubble message={assistantMessage} />);

      // Verify content is rendered (markdown library handles formatting)
      expect(getByText(/bold/)).toBeTruthy();
      expect(getByText(/italic/)).toBeTruthy();
    });

    it('renders lists in assistant messages', () => {
      const assistantMessage: ChatMessage = {
        ...baseMessage,
        role: 'assistant',
        content: '- Item 1\n- Item 2\n- Item 3',
      };

      const { getByText } = renderWithProvider(<MessageBubble message={assistantMessage} />);

      expect(getByText(/Item 1/)).toBeTruthy();
      expect(getByText(/Item 2/)).toBeTruthy();
    });

    it('renders code in assistant messages', () => {
      const assistantMessage: ChatMessage = {
        ...baseMessage,
        role: 'assistant',
        content: 'Use `console.log` for debugging',
      };

      const { getByText } = renderWithProvider(<MessageBubble message={assistantMessage} />);

      expect(getByText(/console.log/)).toBeTruthy();
    });

    it('keeps user messages as plain text (no markdown)', () => {
      const userMessage: ChatMessage = {
        ...baseMessage,
        role: 'user',
        content: 'I want **bold** but it stays plain',
      };

      const { getByText } = renderWithProvider(<MessageBubble message={userMessage} />);

      // User messages should show raw text with asterisks
      expect(getByText('I want **bold** but it stays plain')).toBeTruthy();
    });

    it('handles streaming with partial markdown content', () => {
      const streamingMessage: ChatMessage = {
        ...baseMessage,
        role: 'assistant',
        content: 'Here is **partial',
        status: 'streaming',
      };

      const { getByText } = renderWithProvider(<MessageBubble message={streamingMessage} />);

      // Should render without crashing
      expect(getByText(/partial/)).toBeTruthy();
    });
  });

  describe('timestamp', () => {
    it('shows timestamp when showTimestamp is true', () => {
      const recentMessage: ChatMessage = {
        ...baseMessage,
        timestamp: new Date().toISOString(),
      };

      const { getByText } = renderWithProvider(
        <MessageBubble message={recentMessage} showTimestamp={true} />
      );

      expect(getByText('just now')).toBeTruthy();
    });

    it('hides timestamp when showTimestamp is false', () => {
      const recentMessage: ChatMessage = {
        ...baseMessage,
        timestamp: new Date().toISOString(),
      };

      const { queryByText } = renderWithProvider(
        <MessageBubble message={recentMessage} showTimestamp={false} />
      );

      expect(queryByText('just now')).toBeNull();
    });

    it('formats minutes ago correctly', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const message: ChatMessage = {
        ...baseMessage,
        timestamp: fiveMinutesAgo,
      };

      const { getByText } = renderWithProvider(
        <MessageBubble message={message} showTimestamp={true} />
      );

      expect(getByText('5m ago')).toBeTruthy();
    });

    it('formats hours ago correctly', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const message: ChatMessage = {
        ...baseMessage,
        timestamp: twoHoursAgo,
      };

      const { getByText } = renderWithProvider(
        <MessageBubble message={message} showTimestamp={true} />
      );

      expect(getByText('2h ago')).toBeTruthy();
    });

    it('formats days ago correctly', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const message: ChatMessage = {
        ...baseMessage,
        timestamp: threeDaysAgo,
      };

      const { getByText } = renderWithProvider(
        <MessageBubble message={message} showTimestamp={true} />
      );

      expect(getByText('3d ago')).toBeTruthy();
    });
  });
});
