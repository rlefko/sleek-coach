import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Button, ProgressBar } from 'react-native-paper';
import { spacing } from '@/theme';

interface CalorieInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  target?: number;
  disabled?: boolean;
}

const QUICK_ADD_VALUES = [100, 250, 500];

export const CalorieInput: React.FC<CalorieInputProps> = ({
  value,
  onChange,
  target,
  disabled = false,
}) => {
  const theme = useTheme();

  const handleQuickAdd = (amount: number) => {
    if (disabled) return;
    const newValue = (value ?? 0) + amount;
    onChange(Math.min(newValue, 10000));
  };

  const handleClear = () => {
    if (disabled) return;
    onChange(undefined);
  };

  const progress = target && value ? Math.min(value / target, 1.5) : 0;
  const isOverTarget = target && value && value > target;
  const remaining = target && value !== undefined ? target - value : undefined;

  const getProgressColor = () => {
    if (!target || value === undefined) return theme.colors.primary;
    if (value > target * 1.1) return theme.colors.error;
    if (value > target) return theme.colors.tertiary;
    if (value > target * 0.9) return theme.colors.primary;
    return theme.colors.primary;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          Calories
        </Text>
        {value !== undefined && (
          <Button mode="text" compact onPress={handleClear} disabled={disabled}>
            Clear
          </Button>
        )}
      </View>

      <View style={styles.valueContainer}>
        <Text
          variant="displayLarge"
          style={[
            styles.value,
            { color: isOverTarget ? theme.colors.error : theme.colors.primary },
          ]}
        >
          {value?.toLocaleString() ?? '--'}
        </Text>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          kcal
        </Text>
      </View>

      {target && (
        <View style={styles.targetContainer}>
          <ProgressBar
            progress={Math.min(progress, 1)}
            color={getProgressColor()}
            style={styles.progressBar}
          />
          <View style={styles.targetLabels}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {value?.toLocaleString() ?? '0'} / {target.toLocaleString()}
            </Text>
            {remaining !== undefined && (
              <Text
                variant="bodySmall"
                style={{ color: remaining >= 0 ? theme.colors.primary : theme.colors.error }}
              >
                {remaining >= 0
                  ? `${remaining.toLocaleString()} left`
                  : `${Math.abs(remaining).toLocaleString()} over`}
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.quickAddContainer}>
        <Text
          variant="labelMedium"
          style={[styles.quickAddLabel, { color: theme.colors.onSurfaceVariant }]}
        >
          Quick add:
        </Text>
        <View style={styles.quickAddButtons}>
          {QUICK_ADD_VALUES.map((amount) => (
            <Button
              key={amount}
              mode="contained-tonal"
              compact
              onPress={() => handleQuickAdd(amount)}
              disabled={disabled}
              style={styles.quickAddButton}
            >
              +{amount}
            </Button>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  value: {
    fontWeight: '300',
  },
  targetContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  targetLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  quickAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  quickAddLabel: {
    marginRight: spacing.xs,
  },
  quickAddButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  quickAddButton: {
    minWidth: 60,
  },
});
