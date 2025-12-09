import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { CartesianChart, Line } from 'victory-native';
import { spacing } from '@/theme';
import { Circle } from '@shopify/react-native-skia';

interface DataPoint {
  date: string;
  weight_kg: number;
  moving_average_7d: number | null;
}

interface WeightChartProps {
  data: DataPoint[];
  goalWeight?: number;
  showMovingAverage?: boolean;
  unit?: 'kg' | 'lbs';
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 250;
const KG_TO_LBS = 2.20462;

export const WeightChart: React.FC<WeightChartProps> = ({
  data,
  goalWeight,
  showMovingAverage = true,
  unit = 'kg',
}) => {
  const theme = useTheme();

  const convert = useCallback(
    (value: number) => (unit === 'lbs' ? value * KG_TO_LBS : value),
    [unit]
  );

  const chartData = useMemo(() => {
    return data.map((d) => ({
      x: new Date(d.date).getTime(),
      weight: convert(d.weight_kg),
      movingAvg: d.moving_average_7d !== null ? convert(d.moving_average_7d) : 0,
    }));
  }, [data, convert]);

  const yDomain = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 100 };
    const weights = chartData.map((d) => d.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const padding = (max - min) * 0.1 || 5;
    return { min: Math.floor(min - padding), max: Math.ceil(max + padding) };
  }, [chartData]);

  if (data.length === 0) {
    return (
      <Surface style={[styles.emptyContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          No weight data yet
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Log your first check-in to see your progress
        </Text>
      </Surface>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const hasMovingAverage = data.some((d) => d.moving_average_7d !== null);

  return (
    <View style={styles.container}>
      <View style={{ height: CHART_HEIGHT, width: SCREEN_WIDTH - spacing.lg * 2 }}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={['weight', 'movingAvg']}
          domain={{ y: [yDomain.min, yDomain.max] }}
          axisOptions={{
            formatXLabel: formatDate,
            formatYLabel: (value: number) => value.toFixed(0),
            labelColor: theme.colors.onSurfaceVariant,
            lineColor: theme.colors.outline,
          }}
        >
          {({ points }) => (
            <>
              {/* Moving average line */}
              {showMovingAverage && hasMovingAverage && (
                <Line
                  points={points.movingAvg}
                  color={theme.colors.secondary}
                  strokeWidth={2}
                  curveType="natural"
                />
              )}

              {/* Main weight line */}
              <Line
                points={points.weight}
                color={theme.colors.primary}
                strokeWidth={2}
                curveType="natural"
              />

              {/* Data points */}
              {points.weight.map((point, index) => (
                <Circle
                  key={index}
                  cx={point.x}
                  cy={point.y ?? 0}
                  r={4}
                  color={theme.colors.primary}
                />
              ))}
            </>
          )}
        </CartesianChart>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: theme.colors.primary }]} />
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Weight
          </Text>
        </View>
        {showMovingAverage && hasMovingAverage && (
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: theme.colors.secondary }]} />
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              7-day avg
            </Text>
          </View>
        )}
        {goalWeight && (
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendLine,
                { backgroundColor: theme.colors.tertiary, borderStyle: 'dashed' },
              ]}
            />
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Goal
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  emptyContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
});
