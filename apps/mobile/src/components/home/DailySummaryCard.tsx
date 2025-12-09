import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, ProgressBar, IconButton } from 'react-native-paper';
import { Card, CardContent } from '@/components/ui';
import { spacing } from '@/theme';

interface DailySummaryCardProps {
  todayWeight?: number;
  previousWeight?: number;
  calories?: number;
  calorieTarget?: number;
  protein?: number;
  proteinTarget?: number;
  checkinCompleted: boolean;
  unit?: 'kg' | 'lbs';
  onPress?: () => void;
}

const KG_TO_LBS = 2.20462;

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  todayWeight,
  previousWeight,
  calories,
  calorieTarget,
  protein,
  proteinTarget,
  checkinCompleted,
  unit = 'kg',
  onPress,
}) => {
  const theme = useTheme();

  const displayWeight = (weight?: number) => {
    if (!weight) return '--';
    const converted = unit === 'lbs' ? weight * KG_TO_LBS : weight;
    return converted.toFixed(1);
  };

  const weightChange = todayWeight && previousWeight ? todayWeight - previousWeight : null;
  const displayChange = weightChange
    ? (unit === 'lbs' ? weightChange * KG_TO_LBS : weightChange).toFixed(1)
    : null;

  const calorieProgress = calorieTarget && calories ? Math.min(calories / calorieTarget, 1) : 0;
  const proteinProgress = proteinTarget && protein ? Math.min(protein / proteinTarget, 1) : 0;

  return (
    <Card onPress={onPress}>
      <CardContent>
        <View style={styles.header}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            Today&apos;s Summary
          </Text>
          <IconButton
            icon={checkinCompleted ? 'check-circle' : 'circle-outline'}
            iconColor={checkinCompleted ? theme.colors.primary : theme.colors.outline}
            size={24}
          />
        </View>

        {/* Weight Section */}
        <View style={styles.weightSection}>
          <View style={styles.weightMain}>
            <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
              {displayWeight(todayWeight)}
            </Text>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {unit}
            </Text>
          </View>
          {displayChange && (
            <View
              style={[
                styles.changeBadge,
                {
                  backgroundColor:
                    weightChange! > 0 ? theme.colors.errorContainer : theme.colors.primaryContainer,
                },
              ]}
            >
              <Text
                variant="labelSmall"
                style={{
                  color:
                    weightChange! > 0
                      ? theme.colors.onErrorContainer
                      : theme.colors.onPrimaryContainer,
                }}
              >
                {weightChange! > 0 ? '+' : ''}
                {displayChange} {unit}
              </Text>
            </View>
          )}
        </View>

        {/* Nutrition Progress */}
        <View style={styles.nutritionSection}>
          <View style={styles.nutritionRow}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Calories
            </Text>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
              {calories?.toLocaleString() ?? '--'} / {calorieTarget?.toLocaleString() ?? '--'}
            </Text>
          </View>
          <ProgressBar
            progress={calorieProgress}
            color={theme.colors.primary}
            style={styles.progressBar}
          />

          <View style={[styles.nutritionRow, { marginTop: spacing.sm }]}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Protein
            </Text>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
              {protein ?? '--'}g / {proteinTarget ?? '--'}g
            </Text>
          </View>
          <ProgressBar
            progress={proteinProgress}
            color={theme.colors.tertiary}
            style={styles.progressBar}
          />
        </View>

        {!checkinCompleted && (
          <Text variant="bodySmall" style={[styles.reminder, { color: theme.colors.primary }]}>
            Tap to log today&apos;s check-in
          </Text>
        )}
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  weightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  weightMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  changeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  nutritionSection: {
    marginTop: spacing.sm,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  reminder: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
