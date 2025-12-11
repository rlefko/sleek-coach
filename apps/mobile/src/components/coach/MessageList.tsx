import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { FlatList, StyleSheet, View, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
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
  onScrollPositionChange?: (isAtBottom: boolean) => void;
}

export interface MessageListRef {
  scrollToEnd: (animated?: boolean) => void;
}

const SCROLL_THRESHOLD = 100; // pixels from bottom to consider "at bottom"
const SCROLL_THROTTLE_MS = 50; // minimum time between scroll commands during streaming (reduced for smoother scroll)

export const MessageList = forwardRef<MessageListRef, MessageListProps>(function MessageList(
  { messages, isStreaming, onRetryMessage, ListHeaderComponent, onScrollPositionChange },
  ref
) {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const contentHeightRef = useRef(0);
  const layoutHeightRef = useRef(0);
  const isInitialRenderRef = useRef(true);
  const lastScrollTimeRef = useRef(0);

  // Expose scrollToEnd method via ref
  useImperativeHandle(ref, () => ({
    scrollToEnd: (animated = true) => {
      flatListRef.current?.scrollToEnd({ animated });
      setIsAtBottom(true);
    },
  }));

  // Notify parent when scroll position changes
  useEffect(() => {
    onScrollPositionChange?.(isAtBottom);
  }, [isAtBottom, onScrollPositionChange]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    contentHeightRef.current = contentSize.height;
    layoutHeightRef.current = layoutMeasurement.height;

    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    const atBottom = distanceFromBottom <= SCROLL_THRESHOLD;
    setIsAtBottom(atBottom);
  }, []);

  // Throttled scroll to prevent jitter during streaming
  const throttledScrollToEnd = useCallback((animated: boolean) => {
    const now = Date.now();
    if (now - lastScrollTimeRef.current >= SCROLL_THROTTLE_MS) {
      lastScrollTimeRef.current = now;
      flatListRef.current?.scrollToEnd({ animated });
    }
  }, []);

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentHeightRef.current = height;

      // Always scroll on initial render (no throttle)
      if (isInitialRenderRef.current) {
        flatListRef.current?.scrollToEnd({ animated: false });
        isInitialRenderRef.current = false;
        lastScrollTimeRef.current = Date.now();
        return;
      }

      // Only scroll if at bottom
      if (isAtBottom) {
        if (isStreaming) {
          // During streaming: schedule scroll after layout settles for smoother behavior
          requestAnimationFrame(() => {
            throttledScrollToEnd(true);
          });
        } else {
          // Not streaming: immediate scroll (e.g., new message sent)
          flatListRef.current?.scrollToEnd({ animated: true });
          lastScrollTimeRef.current = Date.now();
        }
      }
    },
    [isAtBottom, isStreaming, throttledScrollToEnd]
  );

  const handleLayout = useCallback(() => {
    // Skip auto-scroll during streaming - handleContentSizeChange handles it
    // This prevents competing scroll commands that cause jitter
    if (isStreaming) {
      return;
    }

    // Only auto-scroll on layout if at bottom (for keyboard/rotation changes)
    if (isAtBottom) {
      flatListRef.current?.scrollToEnd({ animated: false });
    }
  }, [isAtBottom, isStreaming]);

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

  // Filter messages to display - hide empty streaming messages (TypingIndicator shows instead)
  const displayMessages = useMemo(() => {
    return messages.filter(
      (m) => !(m.role === 'assistant' && m.status === 'streaming' && !m.content)
    );
  }, [messages]);

  // Show typing indicator when streaming and:
  // - No messages, or
  // - Last message is from user, or
  // - Last message is an empty streaming assistant message
  const lastMessage = messages[messages.length - 1];
  const showTypingIndicator =
    isStreaming &&
    (messages.length === 0 ||
      lastMessage?.role === 'user' ||
      (lastMessage?.role === 'assistant' &&
        lastMessage?.status === 'streaming' &&
        !lastMessage?.content));

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
      data={displayMessages}
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
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onContentSizeChange={handleContentSizeChange}
      onLayout={handleLayout}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={15}
      getItemLayout={undefined} // Variable height messages
    />
  );
});

MessageList.displayName = 'MessageList';

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
