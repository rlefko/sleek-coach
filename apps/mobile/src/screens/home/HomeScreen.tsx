import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardContent, Button } from '@/components/ui';
import { useAppTheme, spacing } from '@/theme';

export const HomeScreen: React.FC = () => {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.greeting}>
          Welcome back!
        </Text>
        <Text
          variant="bodyLarge"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Home Screen - Phase 7
        </Text>

        <Card variant="elevated">
          <CardContent>
            <Text variant="titleMedium">Today's Summary</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Check-in and nutrition logging will be available here.
            </Text>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Text variant="titleMedium">Quick Actions</Text>
            <View style={styles.actions}>
              <Button variant="primary" style={styles.actionButton}>
                Log Weight
              </Button>
              <Button variant="secondary" style={styles.actionButton}>
                Log Meal
              </Button>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  greeting: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
