import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import { Card, CardContent } from '@/components/ui';
import { spacing } from '@/theme';
import type { WeeklyPlanResponse } from '@/services/api/types';
import { DailyTargetRow } from './DailyTargetRow';
import { MacroBreakdownChart } from './MacroBreakdownChart';
import { FocusAreaList } from './FocusAreaList';
import { ConfidenceIndicator } from './ConfidenceIndicator';

interface WeeklyPlanCardProps {
  plan: WeeklyPlanResponse;
  onRegenerate?: () => void;
  onDiscuss?: () => void;
  isLoading?: boolean;
  compact?: boolean;
}

const formatWeekRange = (weekStart: string): string => {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
};

export const WeeklyPlanCard: React.FC<WeeklyPlanCardProps> = ({
  plan,
  onRegenerate,
  onDiscuss,
  isLoading = false,
  compact = false,
}) => {
  const theme = useTheme();

  if (compact) {
    return (
      <Card>
        <CardContent>
          <View style={styles.compactHeader}>
            <View>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Weekly Plan
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {formatWeekRange(plan.week_start)}
              </Text>
            </View>
            {onRegenerate && (
              <IconButton
                icon="refresh"
                iconColor={theme.colors.primary}
                size={20}
                onPress={onRegenerate}
                disabled={isLoading}
              />
            )}
          </View>
          <View style={styles.compactTargets}>
            <View style={styles.compactTarget}>
              <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                {plan.daily_targets.calories}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                kcal
              </Text>
            </View>
            <View style={styles.compactMacros}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
                P: {plan.daily_targets.protein_g}g
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
                C: {plan.daily_targets.carbs_g}g
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
                F: {plan.daily_targets.fat_g}g
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
              Your Weekly Plan
            </Text>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatWeekRange(plan.week_start)}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {onRegenerate && (
              <IconButton
                icon="refresh"
                iconColor={theme.colors.primary}
                size={24}
                onPress={onRegenerate}
                disabled={isLoading}
              />
            )}
            {onDiscuss && (
              <IconButton
                icon="chat-outline"
                iconColor={theme.colors.primary}
                size={24}
                onPress={onDiscuss}
              />
            )}
          </View>
        </View>

        {/* Macro Breakdown Chart */}
        <View style={styles.chartSection}>
          <MacroBreakdownChart targets={plan.daily_targets} />
        </View>

        {/* Daily Targets */}
        <View style={styles.targetsSection}>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            Daily Targets
          </Text>
          <DailyTargetRow targets={plan.daily_targets} showProgress={false} />
        </View>

        {/* Focus Areas & Recommendations */}
        {(plan.focus_areas.length > 0 || plan.recommendations.length > 0) && (
          <View style={styles.focusSection}>
            <FocusAreaList focusAreas={plan.focus_areas} recommendations={plan.recommendations} />
          </View>
        )}

        {/* Confidence */}
        <View style={styles.confidenceSection}>
          <ConfidenceIndicator confidence={plan.confidence} />
        </View>
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
  },
  chartSection: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
  },
  targetsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  focusSection: {
    marginBottom: spacing.md,
  },
  confidenceSection: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  // Compact styles
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  compactTargets: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactTarget: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  compactMacros: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
