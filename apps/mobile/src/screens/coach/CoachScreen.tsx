import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, IconButton, Menu } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme, spacing } from '@/theme';
import { useChatStream, useChatSessions } from '@/services/hooks';
import { ChatInput, MessageList, SuggestedPrompts } from '@/components/coach';
import type { CoachStackParamList } from '@/navigation/types';

type CoachScreenNavigationProp = NativeStackNavigationProp<CoachStackParamList, 'Coach'>;

export const CoachScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<CoachScreenNavigationProp>();

  const { sendMessage, cancel, isStreaming } = useChatStream();

  const { sessions, currentSessionId, createSession, clearSession, getCurrentMessages } =
    useChatSessions();

  const messages = getCurrentMessages();
  const [menuVisible, setMenuVisible] = React.useState(false);

  // Create a session if none exists
  useEffect(() => {
    if (!currentSessionId && sessions.length === 0) {
      createSession();
    }
  }, [currentSessionId, sessions.length, createSession]);

  const handleSendMessage = useCallback(
    (message: string) => {
      sendMessage(message, currentSessionId || undefined);
    },
    [sendMessage, currentSessionId]
  );

  const handleSuggestedPrompt = useCallback(
    (prompt: string) => {
      handleSendMessage(prompt);
    },
    [handleSendMessage]
  );

  const handleNewConversation = useCallback(() => {
    setMenuVisible(false);
    createSession();
  }, [createSession]);

  const handleClearConversation = useCallback(() => {
    setMenuVisible(false);
    if (currentSessionId) {
      clearSession(currentSessionId);
      createSession();
    }
  }, [currentSessionId, clearSession, createSession]);

  const handleViewPlan = useCallback(() => {
    setMenuVisible(false);
    navigation.navigate('CoachPlan');
  }, [navigation]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
            AI Coach
          </Text>
        </View>
        <View style={styles.headerRight}>
          <IconButton
            icon="calendar-check"
            iconColor={theme.colors.onSurface}
            size={24}
            onPress={handleViewPlan}
          />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                iconColor={theme.colors.onSurface}
                size={24}
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={handleNewConversation}
              title="New conversation"
              leadingIcon="plus"
            />
            <Menu.Item
              onPress={handleClearConversation}
              title="Clear this conversation"
              leadingIcon="delete-outline"
              disabled={messages.length === 0}
            />
            <Menu.Item
              onPress={handleViewPlan}
              title="View weekly plan"
              leadingIcon="calendar-check"
            />
          </Menu>
        </View>
      </View>

      {/* Chat Content */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.messagesContainer}>
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            ListHeaderComponent={
              messages.length === 0 ? (
                <SuggestedPrompts onSelect={handleSuggestedPrompt} visible={!isStreaming} />
              ) : undefined
            }
          />
        </View>

        {/* Input Area */}
        <View style={styles.inputArea}>
          {messages.length > 0 && !isStreaming && (
            <SuggestedPrompts onSelect={handleSuggestedPrompt} />
          )}
          <ChatInput
            onSend={handleSendMessage}
            isStreaming={isStreaming}
            onCancel={cancel}
            placeholder="Ask your coach..."
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  inputArea: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
});
