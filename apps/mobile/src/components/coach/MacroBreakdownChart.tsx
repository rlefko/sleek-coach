import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { spacing } from '@/theme';
import type { DailyTarget } from '@/services/api/types';

interface MacroBreakdownChartProps {
  targets: DailyTarget;
  size?: number;
}

interface MacroLegendItemProps {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

const MacroLegendItem: React.FC<MacroLegendItemProps> = ({ label, value, percentage, color }) => {
  const theme = useTheme();

  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <View style={styles.legendText}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
          {label}
        </Text>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {value}g ({percentage}%)
        </Text>
      </View>
    </View>
  );
};

export const MacroBreakdownChart: React.FC<MacroBreakdownChartProps> = ({
  targets,
  size = 120,
}) => {
  const theme = useTheme();

  // Calculate calories from macros (4 cal/g protein, 4 cal/g carbs, 9 cal/g fat)
  const proteinCal = targets.protein_g * 4;
  const carbsCal = targets.carbs_g * 4;
  const fatCal = targets.fat_g * 9;
  const totalCal = proteinCal + carbsCal + fatCal;

  const proteinPct = Math.round((proteinCal / totalCal) * 100);
  const carbsPct = Math.round((carbsCal / totalCal) * 100);
  const fatPct = 100 - proteinPct - carbsPct; // Ensure we always sum to 100

  // Calculate stroke dash arrays for donut chart segments
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // These calculations would be used for an SVG donut chart implementation
  // const proteinDash = (proteinPct / 100) * circumference;
  // const carbsDash = (carbsPct / 100) * circumference;
  // const fatDash = (fatPct / 100) * circumference;
  // const proteinOffset = 0;
  // const carbsOffset = -proteinDash;
  // const fatOffset = -(proteinDash + carbsDash);
  void circumference; // Mark as intentionally unused for now

  const colors = {
    protein: theme.colors.primary,
    carbs: theme.colors.tertiary,
    fat: theme.colors.secondary,
  };

  return (
    <View style={styles.container}>
      {/* Donut Chart */}
      <View style={[styles.chartContainer, { width: size, height: size }]}>
        <View style={styles.svgContainer}>
          {/* This is a simplified visual representation - in production, use victory-native or react-native-svg */}
          <View
            style={[
              styles.donutBackground,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: theme.colors.surfaceVariant,
              },
            ]}
          />
          {/* Simplified segment indicators */}
          <View style={styles.centerContent}>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
              {targets.calories}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              kcal
            </Text>
          </View>
        </View>

        {/* Segment indicators at bottom */}
        <View style={styles.segmentBar}>
          <View
            style={[
              styles.segment,
              {
                flex: proteinPct,
                backgroundColor: colors.protein,
                borderTopLeftRadius: 4,
                borderBottomLeftRadius: 4,
              },
            ]}
          />
          <View
            style={[
              styles.segment,
              {
                flex: carbsPct,
                backgroundColor: colors.carbs,
              },
            ]}
          />
          <View
            style={[
              styles.segment,
              {
                flex: fatPct,
                backgroundColor: colors.fat,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
              },
            ]}
          />
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <MacroLegendItem
          label="Protein"
          value={targets.protein_g}
          percentage={proteinPct}
          color={colors.protein}
        />
        <MacroLegendItem
          label="Carbs"
          value={targets.carbs_g}
          percentage={carbsPct}
          color={colors.carbs}
        />
        <MacroLegendItem label="Fat" value={targets.fat_g} percentage={fatPct} color={colors.fat} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutBackground: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBar: {
    flexDirection: 'row',
    width: '100%',
    height: 8,
    marginTop: spacing.md,
    borderRadius: 4,
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    gap: 2,
  },
});
