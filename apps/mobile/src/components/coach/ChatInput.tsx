import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, Pressable, Keyboard } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import { spacing } from '@/theme';

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  onCancel?: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isStreaming,
  onCancel,
  disabled = false,
  placeholder = 'Ask your coach...',
  maxLength = 5000,
}) => {
  const theme = useTheme();
  const [message, setMessage] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || isStreaming || disabled) return;

    onSend(trimmed);
    setMessage('');
    Keyboard.dismiss();
  }, [message, isStreaming, disabled, onSend]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const canSend = message.trim().length > 0 && !isStreaming && !disabled;
  const showCharCount = message.length > maxLength * 0.8;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: theme.colors.onSurface }]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={maxLength}
          editable={!isStreaming && !disabled}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />

        {showCharCount && (
          <Text
            variant="labelSmall"
            style={[
              styles.charCount,
              {
                color:
                  message.length >= maxLength ? theme.colors.error : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {message.length}/{maxLength}
          </Text>
        )}
      </View>

      {isStreaming ? (
        <Pressable
          onPress={handleCancel}
          style={[styles.sendButton, { backgroundColor: theme.colors.errorContainer }]}
        >
          <IconButton
            icon="stop"
            iconColor={theme.colors.onErrorContainer}
            size={20}
            style={styles.iconButton}
          />
        </Pressable>
      ) : (
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={[
            styles.sendButton,
            {
              backgroundColor: canSend ? theme.colors.primary : theme.colors.surfaceDisabled,
            },
          ]}
        >
          <IconButton
            icon="send"
            iconColor={canSend ? theme.colors.onPrimary : theme.colors.onSurfaceDisabled}
            size={20}
            style={styles.iconButton}
          />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'column',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    margin: 0,
  },
});
