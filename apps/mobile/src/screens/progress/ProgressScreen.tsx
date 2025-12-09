import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardContent } from '@/components/ui';
import { useAppTheme, spacing } from '@/theme';

export const ProgressScreen: React.FC = () => {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          Progress
        </Text>
        <Text
          variant="bodyLarge"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Progress Screen - Phase 7
        </Text>

        <Card variant="elevated">
          <CardContent>
            <Text variant="titleMedium">Weight Trend</Text>
            <View style={styles.chartPlaceholder}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Weight chart will appear here
              </Text>
            </View>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Text variant="titleMedium">Adherence Metrics</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Check-in and nutrition adherence will be tracked here.
            </Text>
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
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
});
