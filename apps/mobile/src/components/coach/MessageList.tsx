import React, { useCallback, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { spacing } from '@/theme';
import type { ChatMessage } from '@/services/api/types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { EmptyState } from '@/components/ui';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onRetryMessage?: (message: ChatMessage) => void;
  ListHeaderComponent?: React.ReactElement;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming,
  onRetryMessage,
  ListHeaderComponent,
}) => {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <MessageBubble
        message={item}
        onRetry={item.status === 'error' ? () => onRetryMessage?.(item) : undefined}
      />
    ),
    [onRetryMessage]
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  // Show typing indicator when streaming and last message is not from assistant
  // or when last assistant message is still streaming
  const showTypingIndicator =
    isStreaming && (messages.length === 0 || messages[messages.length - 1]?.role === 'user');

  if (messages.length === 0 && !isStreaming) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="robot-happy-outline"
          title="Chat with Your Coach"
          description="Ask me anything about your nutrition, training, or progress. I'm here to help you reach your goals!"
        />
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={keyExtractor}
      style={[styles.list, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      inverted={false}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={
        showTypingIndicator ? (
          <View style={styles.typingContainer}>
            <TypingIndicator />
          </View>
        ) : null
      }
      onContentSizeChange={() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }}
      onLayout={() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={15}
      getItemLayout={undefined} // Variable height messages
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  typingContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
