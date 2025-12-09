import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme, spacing } from '@/theme';
import { usePhotos } from '@/services/hooks';
import { LoadingSpinner } from '@/components/ui';
import { PhotoComparisonView } from '@/components/progress';

export const PhotoComparisonScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const { data: photosData, isLoading } = usePhotos();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
          Compare Progress Photos
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, marginBottom: spacing.lg }}
        >
          Select dates to compare your transformation
        </Text>

        <PhotoComparisonView photos={photosData?.items ?? []} />
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
});
