import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import { spacing } from '@/theme';

interface AdherenceMetricsProps {
  checkinPercent: number;
  nutritionPercent: number;
  targetPercent?: number;
}

interface MetricCircleProps {
  label: string;
  percent: number;
  color: string;
}

const MetricItem: React.FC<MetricCircleProps> = ({ label, percent, color }) => {
  const theme = useTheme();
  const displayPercent = Math.round(percent);

  return (
    <View style={styles.metricItem}>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <View style={styles.percentContainer}>
        <Text
          variant="headlineMedium"
          style={[styles.percentText, { color: percent >= 80 ? color : theme.colors.onSurface }]}
        >
          {displayPercent}%
        </Text>
      </View>
      <ProgressBar progress={percent / 100} color={color} style={styles.progressBar} />
    </View>
  );
};

export const AdherenceMetrics: React.FC<AdherenceMetricsProps> = ({
  checkinPercent,
  nutritionPercent,
  targetPercent,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
        Adherence
      </Text>
      <View style={styles.metricsRow}>
        <MetricItem label="Check-ins" percent={checkinPercent} color={theme.colors.primary} />
        <MetricItem label="Nutrition" percent={nutritionPercent} color={theme.colors.tertiary} />
        {targetPercent !== undefined && (
          <MetricItem label="On Target" percent={targetPercent} color={theme.colors.secondary} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  title: {
    marginBottom: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  percentContainer: {
    marginVertical: spacing.sm,
  },
  percentText: {
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
  },
});
