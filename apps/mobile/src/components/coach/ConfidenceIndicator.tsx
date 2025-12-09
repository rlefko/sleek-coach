import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing } from '@/theme';
import type { DataGap } from '@/services/api/types';

interface ConfidenceIndicatorProps {
  confidence: number;
  dataGaps?: DataGap[];
  initialExpanded?: boolean;
}

const getConfidenceColor = (
  confidence: number,
  colors: { primary: string; error: string }
): string => {
  if (confidence >= 0.8) return colors.primary;
  if (confidence >= 0.5) return '#F59E0B'; // Amber/warning
  return colors.error;
};

const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 0.8) return 'High confidence';
  if (confidence >= 0.5) return 'Moderate confidence';
  return 'Low confidence';
};

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  dataGaps,
  initialExpanded = false,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(initialExpanded);

  const color = getConfidenceColor(confidence, theme.colors);
  const label = getConfidenceLabel(confidence);
  const percentage = Math.round(confidence * 100);
  const hasGaps = dataGaps && dataGaps.length > 0;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => hasGaps && setExpanded(!expanded)}
        style={styles.header}
        disabled={!hasGaps}
      >
        <View style={styles.barContainer}>
          <View
            style={[
              styles.barFill,
              {
                width: `${percentage}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
        <View style={styles.labelRow}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {label} ({percentage}%)
          </Text>
          {hasGaps && (
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.colors.onSurfaceVariant}
            />
          )}
        </View>
      </Pressable>

      {expanded && hasGaps && (
        <View style={[styles.gapsContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text variant="labelMedium" style={[styles.gapsTitle, { color: theme.colors.onSurface }]}>
            What could improve this response:
          </Text>
          {dataGaps.map((gap, index) => (
            <View key={index} style={styles.gapItem}>
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={14}
                color={theme.colors.primary}
                style={styles.gapIcon}
              />
              <View style={styles.gapContent}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                  {gap.description}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                  {gap.suggestion}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
  },
  header: {
    gap: spacing.xs,
  },
  barContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gapsContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 8,
    gap: spacing.sm,
  },
  gapsTitle: {
    marginBottom: spacing.xs,
  },
  gapItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  gapIcon: {
    marginTop: 2,
    marginRight: spacing.xs,
  },
  gapContent: {
    flex: 1,
    gap: spacing.xs,
  },
});
