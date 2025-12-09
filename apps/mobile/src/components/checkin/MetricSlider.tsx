import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { spacing } from '@/theme';

type MetricType = 'energy' | 'sleep' | 'mood';

interface MetricSliderProps {
  type: MetricType;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
}

const METRIC_CONFIG: Record<MetricType, { label: string; emojis: string[] }> = {
  energy: {
    label: 'Energy Level',
    emojis: ['', '', '', '', ''],
  },
  sleep: {
    label: 'Sleep Quality',
    emojis: ['', '', '', '', ''],
  },
  mood: {
    label: 'Mood',
    emojis: ['', '', '', '', ''],
  },
};

export const MetricSlider: React.FC<MetricSliderProps> = ({
  type,
  value,
  onChange,
  disabled = false,
}) => {
  const theme = useTheme();
  const config = METRIC_CONFIG[type];

  const handlePress = (level: number) => {
    if (disabled) return;
    // Toggle off if same value
    if (value === level) {
      onChange(undefined);
    } else {
      onChange(level);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
        {config.label}
      </Text>
      <View style={styles.buttonRow}>
        {[1, 2, 3, 4, 5].map((level) => {
          const isSelected = value === level;
          return (
            <Pressable
              key={level}
              onPress={() => handlePress(level)}
              disabled={disabled}
              style={[
                styles.button,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primaryContainer
                    : theme.colors.surfaceVariant,
                  borderColor: isSelected ? theme.colors.primary : 'transparent',
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              <Text style={styles.emoji}>{config.emojis[level - 1]}</Text>
              <Text
                variant="labelSmall"
                style={{
                  color: isSelected
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurfaceVariant,
                }}
              >
                {level}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {value && (
        <Text variant="bodySmall" style={[styles.selectedLabel, { color: theme.colors.primary }]}>
          {getLevelDescription(type, value)}
        </Text>
      )}
    </View>
  );
};

function getLevelDescription(type: MetricType, level: number): string {
  const descriptions: Record<MetricType, string[]> = {
    energy: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
    sleep: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
    mood: ['Very Low', 'Low', 'Neutral', 'Good', 'Great'],
  };
  return descriptions[type][level - 1];
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
  },
  emoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  selectedLabel: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
