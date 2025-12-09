import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui';
import { useAppTheme, spacing } from '@/theme';

export const CoachScreen: React.FC = () => {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium">AI Coach</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Phase 9
        </Text>
      </View>
      <EmptyState
        icon="robot-outline"
        title="Coming Soon"
        description="Chat with your AI fitness coach to get personalized guidance and recommendations."
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    paddingBottom: 0,
  },
});
