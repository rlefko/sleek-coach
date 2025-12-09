import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, ScrollView, View, RefreshControl } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme, spacing } from '@/theme';
import {
  useWeightTrend,
  useCheckins,
  useNutritionRange,
  useUser,
  usePhotos,
} from '@/services/hooks';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, LoadingSpinner } from '@/components/ui';
import {
  DateRangeSelector,
  getDaysFromRange,
  WeightChart,
  AdherenceMetrics,
  PhotoComparisonView,
  type DateRange,
} from '@/components/progress';
import type { ProgressStackParamList } from '@/navigation/types';

type ProgressNavigationProp = NativeStackNavigationProp<ProgressStackParamList, 'Progress'>;

function getDateRange(days: number | undefined): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (days) {
    from.setDate(from.getDate() - days);
  } else {
    from.setFullYear(from.getFullYear() - 1); // Default to 1 year for "all"
  }
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

export const ProgressScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<ProgressNavigationProp>();
  const unitSystem = useUIStore((s) => s.unitSystem);
  const unit = unitSystem === 'imperial' ? 'lbs' : 'kg';

  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [refreshing, setRefreshing] = useState(false);

  const days = getDaysFromRange(dateRange);
  const { from, to } = useMemo(() => getDateRange(days), [days]);

  const { data: user } = useUser();
  const {
    data: weightTrend,
    isLoading: trendLoading,
    refetch: refetchTrend,
  } = useWeightTrend(days ?? 365);
  const { data: checkinsData, refetch: refetchCheckins } = useCheckins({ from, to });
  const { data: nutritionData, refetch: refetchNutrition } = useNutritionRange(from, to);
  const { data: photosData, refetch: refetchPhotos } = usePhotos({ from, to });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchTrend(), refetchCheckins(), refetchNutrition(), refetchPhotos()]);
    setRefreshing(false);
  }, [refetchTrend, refetchCheckins, refetchNutrition, refetchPhotos]);

  const goalWeight = user?.goal?.target_weight_kg ?? undefined;

  // Calculate adherence metrics
  const adherenceMetrics = useMemo(() => {
    const totalDays = days ?? 30;
    const checkinDays = checkinsData?.items.length ?? 0;
    const nutritionDays = nutritionData?.items.length ?? 0;

    return {
      checkinPercent: Math.round((checkinDays / totalDays) * 100),
      nutritionPercent: Math.round((nutritionDays / totalDays) * 100),
    };
  }, [days, checkinsData?.items.length, nutritionData?.items.length]);

  // Calculate stats
  const stats = useMemo(() => {
    const trend = weightTrend;
    const nutrition = nutritionData?.items ?? [];

    const avgCalories =
      nutrition.length > 0
        ? Math.round(nutrition.reduce((sum, n) => sum + (n.calories ?? 0), 0) / nutrition.length)
        : undefined;

    const avgProtein =
      nutrition.length > 0
        ? Math.round(nutrition.reduce((sum, n) => sum + (n.protein_g ?? 0), 0) / nutrition.length)
        : undefined;

    return {
      totalChange: trend?.total_change,
      weeklyRate: trend?.weekly_rate_of_change,
      startWeight: trend?.start_weight,
      currentWeight: trend?.current_weight,
      avgCalories,
      avgProtein,
    };
  }, [weightTrend, nutritionData?.items]);

  const handleNavigateToPhotos = useCallback(() => {
    navigation.navigate('PhotoComparison');
  }, [navigation]);

  if (trendLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
          Progress
        </Text>

        {/* Date Range Selector */}
        <View style={styles.dateRangeContainer}>
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
        </View>

        {/* Weight Chart */}
        <Card variant="elevated">
          <CardContent>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface, marginBottom: spacing.sm }}
            >
              Weight Trend
            </Text>
            <WeightChart
              data={weightTrend?.data ?? []}
              goalWeight={goalWeight}
              showMovingAverage
              unit={unit}
            />
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <Card variant="outlined" style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Total Change
              </Text>
              <Text
                variant="titleLarge"
                style={{
                  color:
                    stats.totalChange && stats.totalChange < 0
                      ? theme.colors.primary
                      : theme.colors.onSurface,
                }}
              >
                {stats.totalChange
                  ? `${stats.totalChange > 0 ? '+' : ''}${(unit === 'lbs' ? stats.totalChange * 2.20462 : stats.totalChange).toFixed(1)} ${unit}`
                  : '--'}
              </Text>
            </CardContent>
          </Card>

          <Card variant="outlined" style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Weekly Rate
              </Text>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                {stats.weeklyRate
                  ? `${stats.weeklyRate > 0 ? '+' : ''}${(unit === 'lbs' ? stats.weeklyRate * 2.20462 : stats.weeklyRate).toFixed(2)} ${unit}/wk`
                  : '--'}
              </Text>
            </CardContent>
          </Card>
        </View>

        <View style={styles.statsRow}>
          <Card variant="outlined" style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Avg Calories
              </Text>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                {stats.avgCalories?.toLocaleString() ?? '--'}
              </Text>
            </CardContent>
          </Card>

          <Card variant="outlined" style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Avg Protein
              </Text>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                {stats.avgProtein ? `${stats.avgProtein}g` : '--'}
              </Text>
            </CardContent>
          </Card>
        </View>

        {/* Adherence Metrics */}
        <Card variant="outlined">
          <CardContent>
            <AdherenceMetrics
              checkinPercent={adherenceMetrics.checkinPercent}
              nutritionPercent={adherenceMetrics.nutritionPercent}
            />
          </CardContent>
        </Card>

        {/* Photo Comparison Preview */}
        <Card variant="outlined">
          <CardContent>
            <View style={styles.photoHeader}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Progress Photos
              </Text>
              {(photosData?.items.length ?? 0) > 1 && (
                <Button mode="text" compact onPress={handleNavigateToPhotos}>
                  View All
                </Button>
              )}
            </View>
            <PhotoComparisonView photos={photosData?.items ?? []} />
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
    gap: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
  },
  dateRangeContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
