import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { spacing } from '@/theme';

type IconName = React.ComponentProps<typeof Icon>['name'];

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  visible?: boolean;
}

interface SuggestedPrompt {
  text: string;
  icon: IconName;
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    text: 'What should I eat today?',
    icon: 'food-apple',
  },
  {
    text: 'How am I progressing?',
    icon: 'chart-line',
  },
  {
    text: 'Adjust my targets',
    icon: 'target',
  },
  {
    text: 'Review my week',
    icon: 'calendar-week',
  },
  {
    text: 'Help me stay on track',
    icon: 'hand-heart',
  },
];

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onSelect, visible = true }) => {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={[styles.title, { color: theme.colors.onSurfaceVariant }]}>
        Try asking...
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SUGGESTED_PROMPTS.map((prompt) => (
          <Pressable
            key={prompt.text}
            onPress={() => onSelect(prompt.text)}
            style={({ pressed }) => [
              styles.promptChip,
              {
                backgroundColor: pressed
                  ? theme.colors.primaryContainer
                  : theme.colors.surfaceVariant,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <Icon name={prompt.icon} size={16} color={theme.colors.primary} style={styles.icon} />
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
              numberOfLines={1}
            >
              {prompt.text}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  title: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  icon: {
    marginRight: spacing.xs,
  },
});
