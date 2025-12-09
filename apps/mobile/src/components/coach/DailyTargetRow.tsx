import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import { spacing } from '@/theme';
import type { DailyTarget } from '@/services/api/types';

interface DailyTargetRowProps {
  targets: DailyTarget;
  currentValues?: Partial<DailyTarget>;
  showProgress?: boolean;
}

interface MacroRowProps {
  label: string;
  target: number;
  current?: number;
  unit: string;
  color: string;
}

const MacroRow: React.FC<MacroRowProps> = ({ label, target, current, unit, color }) => {
  const theme = useTheme();
  const progress = current !== undefined ? Math.min(current / target, 1) : 0;

  return (
    <View style={styles.macroRow}>
      <View style={styles.macroHeader}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
          {current !== undefined ? `${current} / ` : ''}
          {target}
          {unit}
        </Text>
      </View>
      {current !== undefined && (
        <ProgressBar progress={progress} color={color} style={styles.progressBar} />
      )}
    </View>
  );
};

export const DailyTargetRow: React.FC<DailyTargetRowProps> = ({
  targets,
  currentValues,
  showProgress = true,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Calories - Main */}
      <View style={styles.caloriesSection}>
        <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
          {targets.calories.toLocaleString()}
        </Text>
        <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          calories
        </Text>
        {currentValues?.calories !== undefined && showProgress && (
          <View style={styles.caloriesProgress}>
            <ProgressBar
              progress={Math.min(currentValues.calories / targets.calories, 1)}
              color={theme.colors.primary}
              style={styles.caloriesBar}
            />
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {currentValues.calories.toLocaleString()} consumed
            </Text>
          </View>
        )}
      </View>

      {/* Macros */}
      <View style={styles.macrosSection}>
        <MacroRow
          label="Protein"
          target={targets.protein_g}
          current={showProgress ? currentValues?.protein_g : undefined}
          unit="g"
          color={theme.colors.primary}
        />
        <MacroRow
          label="Carbs"
          target={targets.carbs_g}
          current={showProgress ? currentValues?.carbs_g : undefined}
          unit="g"
          color={theme.colors.tertiary}
        />
        <MacroRow
          label="Fat"
          target={targets.fat_g}
          current={showProgress ? currentValues?.fat_g : undefined}
          unit="g"
          color={theme.colors.secondary}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  caloriesSection: {
    alignItems: 'center',
  },
  caloriesProgress: {
    width: '100%',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  caloriesBar: {
    height: 8,
    borderRadius: 4,
  },
  macrosSection: {
    gap: spacing.sm,
  },
  macroRow: {
    gap: spacing.xs,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
});
