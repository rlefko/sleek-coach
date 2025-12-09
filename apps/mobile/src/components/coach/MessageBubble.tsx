import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { spacing } from '@/theme';
import type { ChatMessage } from '@/services/api/types';
import { ToolDisclosure } from './ToolDisclosure';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { DisclaimerBanner } from './DisclaimerBanner';

interface MessageBubbleProps {
  message: ChatMessage;
  showTimestamp?: boolean;
  onRetry?: () => void;
}

const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffMs = now.getTime() - messageTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return messageTime.toLocaleDateString();
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showTimestamp = true,
  onRetry,
}) => {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {/* Avatar for assistant */}
      {!isUser && (
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.colors.primaryContainer,
            },
          ]}
        >
          <Icon name="robot" size={20} color={theme.colors.onPrimaryContainer} />
        </View>
      )}

      <View style={[styles.bubbleContainer, isUser && styles.userBubbleContainer]}>
        {/* Message Bubble */}
        <View
          style={[
            styles.bubble,
            isUser
              ? {
                  backgroundColor: theme.colors.primary,
                  borderBottomRightRadius: 4,
                }
              : {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderBottomLeftRadius: 4,
                },
            isError && { borderColor: theme.colors.error, borderWidth: 1 },
          ]}
        >
          <Text
            variant="bodyMedium"
            style={{
              color: isUser ? theme.colors.onPrimary : theme.colors.onSurface,
            }}
          >
            {message.content || (isStreaming ? '...' : '')}
          </Text>

          {isStreaming && (
            <View style={styles.streamingIndicator}>
              <Icon name="loading" size={14} color={theme.colors.onSurfaceVariant} />
            </View>
          )}

          {isError && message.errorMessage && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={14} color={theme.colors.error} />
              <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                {message.errorMessage}
              </Text>
              {onRetry && (
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.primary }}
                  onPress={onRetry}
                >
                  Tap to retry
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Disclaimers */}
        {!isUser && message.disclaimers && message.disclaimers.length > 0 && (
          <View style={styles.metaContainer}>
            <DisclaimerBanner disclaimers={message.disclaimers} variant="warning" />
          </View>
        )}

        {/* Tool Disclosure */}
        {!isUser && message.toolTrace && message.toolTrace.length > 0 && (
          <View style={styles.metaContainer}>
            <ToolDisclosure traces={message.toolTrace} />
          </View>
        )}

        {/* Confidence Indicator */}
        {!isUser && message.confidence !== undefined && message.status === 'complete' && (
          <View style={styles.metaContainer}>
            <ConfidenceIndicator confidence={message.confidence} dataGaps={message.dataGaps} />
          </View>
        )}

        {/* Timestamp */}
        {showTimestamp && !isStreaming && (
          <Text
            variant="labelSmall"
            style={[
              styles.timestamp,
              { color: theme.colors.onSurfaceVariant },
              isUser && styles.userTimestamp,
            ]}
          >
            {formatRelativeTime(message.timestamp)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  bubbleContainer: {
    maxWidth: '80%',
    gap: spacing.xs,
  },
  userBubbleContainer: {
    alignItems: 'flex-end',
  },
  bubble: {
    padding: spacing.md,
    borderRadius: 16,
  },
  streamingIndicator: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  metaContainer: {
    marginTop: spacing.xs,
  },
  timestamp: {
    marginTop: spacing.xs,
  },
  userTimestamp: {
    textAlign: 'right',
  },
});
