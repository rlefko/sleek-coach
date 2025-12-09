import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, ProgressBar, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Card, CardContent } from '@/components/ui';
import { spacing } from '@/theme';
import { usePlan, useGeneratePlan } from '@/services/hooks';
import type { NutritionDay } from '@/services/api/types';

interface CoachPlanWidgetProps {
  todayNutrition?: NutritionDay | null;
  onPress?: () => void;
}

export const CoachPlanWidget: React.FC<CoachPlanWidgetProps> = ({ todayNutrition, onPress }) => {
  const theme = useTheme();
  const { data: plan, isLoading, isError } = usePlan();
  const generatePlan = useGeneratePlan();

  const handleGeneratePlan = () => {
    generatePlan.mutate(undefined);
  };

  // No plan state
  if (!plan && !isLoading) {
    return (
      <Card onPress={handleGeneratePlan}>
        <CardContent>
          <View style={styles.noPlanContainer}>
            <Icon
              name="calendar-plus"
              size={32}
              color={theme.colors.primary}
              style={styles.noPlanIcon}
            />
            <View style={styles.noPlanText}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Get Your Plan
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Generate personalized targets
              </Text>
            </View>
            <IconButton icon="chevron-right" iconColor={theme.colors.onSurfaceVariant} size={24} />
          </View>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <View style={styles.loadingContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Loading plan...
            </Text>
          </View>
        </CardContent>
      </Card>
    );
  }

  // Error state - fallback to generate
  if (isError || !plan) {
    return (
      <Card onPress={handleGeneratePlan}>
        <CardContent>
          <View style={styles.noPlanContainer}>
            <Icon name="refresh" size={24} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Tap to load plan
            </Text>
          </View>
        </CardContent>
      </Card>
    );
  }

  // Plan exists - show compact view
  const { daily_targets } = plan;
  const currentCalories = todayNutrition?.calories || 0;
  const currentProtein = todayNutrition?.protein_g || 0;

  const calorieProgress = Math.min(currentCalories / daily_targets.calories, 1);
  const proteinProgress = Math.min(currentProtein / daily_targets.protein_g, 1);

  return (
    <Pressable onPress={onPress}>
      <Card>
        <CardContent>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Icon name="calendar-check" size={20} color={theme.colors.primary} />
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Today&apos;s Targets
              </Text>
            </View>
            <IconButton
              icon="chevron-right"
              iconColor={theme.colors.onSurfaceVariant}
              size={20}
              style={styles.chevron}
            />
          </View>

          {/* Calories */}
          <View style={styles.targetRow}>
            <View style={styles.targetHeader}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Calories
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
                {currentCalories.toLocaleString()} / {daily_targets.calories.toLocaleString()}
              </Text>
            </View>
            <ProgressBar
              progress={calorieProgress}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          </View>

          {/* Protein */}
          <View style={styles.targetRow}>
            <View style={styles.targetHeader}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Protein
              </Text>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
                {currentProtein}g / {daily_targets.protein_g}g
              </Text>
            </View>
            <ProgressBar
              progress={proteinProgress}
              color={theme.colors.tertiary}
              style={styles.progressBar}
            />
          </View>

          {/* Macro summary */}
          <View style={styles.macroSummary}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              C: {daily_targets.carbs_g}g • F: {daily_targets.fat_g}g
            </Text>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chevron: {
    margin: -spacing.sm,
  },
  targetRow: {
    marginBottom: spacing.sm,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  macroSummary: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  noPlanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noPlanIcon: {
    marginRight: spacing.md,
  },
  noPlanText: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.md,
  },
});
