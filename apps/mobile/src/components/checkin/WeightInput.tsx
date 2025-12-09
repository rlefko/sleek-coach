import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, IconButton, SegmentedButtons } from 'react-native-paper';
import { spacing } from '@/theme';

interface WeightInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  unit: 'kg' | 'lbs';
  onUnitChange: (unit: 'kg' | 'lbs') => void;
  lastWeight?: number;
  disabled?: boolean;
}

const STEP = 0.1;
const MIN_WEIGHT_KG = 20;
const MAX_WEIGHT_KG = 500;

// Conversion constant
const KG_TO_LBS = 2.20462;

function convertFromKg(value: number, unit: 'kg' | 'lbs'): number {
  return unit === 'lbs' ? value * KG_TO_LBS : value;
}

export const WeightInput: React.FC<WeightInputProps> = ({
  value,
  onChange,
  unit,
  onUnitChange,
  lastWeight,
  disabled = false,
}) => {
  const theme = useTheme();

  const displayValue = value !== undefined ? convertFromKg(value, unit) : undefined;
  const displayLastWeight = lastWeight !== undefined ? convertFromKg(lastWeight, unit) : undefined;

  const handleIncrement = useCallback(() => {
    if (disabled) return;
    const currentKg = value ?? lastWeight ?? 70;
    const newKg = Math.min(currentKg + STEP, MAX_WEIGHT_KG);
    onChange(Math.round(newKg * 10) / 10);
  }, [value, lastWeight, onChange, disabled]);

  const handleDecrement = useCallback(() => {
    if (disabled) return;
    const currentKg = value ?? lastWeight ?? 70;
    const newKg = Math.max(currentKg - STEP, MIN_WEIGHT_KG);
    onChange(Math.round(newKg * 10) / 10);
  }, [value, lastWeight, onChange, disabled]);

  const handleUnitChange = useCallback(
    (newUnit: string) => {
      onUnitChange(newUnit as 'kg' | 'lbs');
    },
    [onUnitChange]
  );

  const formattedValue = displayValue !== undefined ? displayValue.toFixed(1) : '--.-';
  const formattedLastWeight = displayLastWeight?.toFixed(1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          Weight
        </Text>
        <SegmentedButtons
          value={unit}
          onValueChange={handleUnitChange}
          buttons={[
            { value: 'kg', label: 'kg' },
            { value: 'lbs', label: 'lbs' },
          ]}
          style={styles.unitToggle}
          density="small"
        />
      </View>

      <View style={styles.inputContainer}>
        <IconButton
          icon="minus"
          mode="contained-tonal"
          size={28}
          onPress={handleDecrement}
          disabled={disabled}
        />

        <Pressable
          onPress={() => !disabled && onChange(lastWeight ?? 70)}
          style={styles.valueContainer}
        >
          <Text
            variant="displayLarge"
            style={[
              styles.value,
              { color: value ? theme.colors.primary : theme.colors.onSurfaceVariant },
            ]}
          >
            {formattedValue}
          </Text>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {unit}
          </Text>
        </Pressable>

        <IconButton
          icon="plus"
          mode="contained-tonal"
          size={28}
          onPress={handleIncrement}
          disabled={disabled}
        />
      </View>

      {formattedLastWeight && (
        <Text
          variant="bodySmall"
          style={[styles.lastWeight, { color: theme.colors.onSurfaceVariant }]}
        >
          Last: {formattedLastWeight} {unit}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },
  unitToggle: {
    width: 120,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    minWidth: 140,
    gap: spacing.xs,
  },
  value: {
    fontWeight: '300',
    textAlign: 'center',
  },
  lastWeight: {
    marginTop: spacing.sm,
  },
});
