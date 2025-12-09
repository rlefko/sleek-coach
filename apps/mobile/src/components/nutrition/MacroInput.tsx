import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, TextInput, Switch, ProgressBar } from 'react-native-paper';
import { spacing } from '@/theme';
import { calculateCaloriesFromMacros } from '@/schemas/nutritionSchemas';

interface MacroValues {
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface MacroTargets {
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface MacroInputProps {
  values: MacroValues;
  onChange: (values: MacroValues) => void;
  targets?: MacroTargets;
  autoCalcCalories?: boolean;
  onAutoCalcChange?: (enabled: boolean) => void;
  onCaloriesChange?: (calories: number | undefined) => void;
  disabled?: boolean;
}

interface MacroFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  target?: number;
  color: string;
  disabled?: boolean;
}

const MacroField: React.FC<MacroFieldProps> = ({
  label,
  value,
  onChange,
  target,
  color,
  disabled,
}) => {
  const theme = useTheme();
  const progress = target && value ? Math.min(value / target, 1) : 0;

  const handleChange = (text: string) => {
    const num = parseFloat(text);
    onChange(isNaN(num) ? undefined : num);
  };

  return (
    <View style={styles.macroField}>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <TextInput
        mode="outlined"
        value={value?.toString() ?? ''}
        onChangeText={handleChange}
        keyboardType="numeric"
        placeholder="0"
        dense
        disabled={disabled}
        style={styles.input}
        right={<TextInput.Affix text="g" />}
      />
      {target && (
        <>
          <ProgressBar progress={progress} color={color} style={styles.miniProgress} />
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
          >
            {value ?? 0} / {target}g
          </Text>
        </>
      )}
    </View>
  );
};

export const MacroInput: React.FC<MacroInputProps> = ({
  values,
  onChange,
  targets,
  autoCalcCalories = false,
  onAutoCalcChange,
  onCaloriesChange,
  disabled = false,
}) => {
  const theme = useTheme();

  const handleMacroChange = (macro: keyof MacroValues, value: number | undefined) => {
    const newValues = { ...values, [macro]: value };
    onChange(newValues);

    if (autoCalcCalories && onCaloriesChange) {
      const calculatedCalories = calculateCaloriesFromMacros(
        newValues.protein,
        newValues.carbs,
        newValues.fat
      );
      onCaloriesChange(calculatedCalories);
    }
  };

  const calculatedCalories = calculateCaloriesFromMacros(values.protein, values.carbs, values.fat);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          Macros
        </Text>
        {onAutoCalcChange && (
          <View style={styles.autoCalcContainer}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Auto-calc calories
            </Text>
            <Switch value={autoCalcCalories} onValueChange={onAutoCalcChange} disabled={disabled} />
          </View>
        )}
      </View>

      <View style={styles.macroRow}>
        <MacroField
          label="Protein"
          value={values.protein}
          onChange={(v) => handleMacroChange('protein', v)}
          target={targets?.protein}
          color={theme.colors.primary}
          disabled={disabled}
        />
        <MacroField
          label="Carbs"
          value={values.carbs}
          onChange={(v) => handleMacroChange('carbs', v)}
          target={targets?.carbs}
          color={theme.colors.tertiary}
          disabled={disabled}
        />
        <MacroField
          label="Fat"
          value={values.fat}
          onChange={(v) => handleMacroChange('fat', v)}
          target={targets?.fat}
          color={theme.colors.secondary}
          disabled={disabled}
        />
      </View>

      {autoCalcCalories && calculatedCalories !== undefined && (
        <Text
          variant="bodySmall"
          style={[styles.calculatedCalories, { color: theme.colors.onSurfaceVariant }]}
        >
          Calculated: {calculatedCalories.toLocaleString()} kcal (P*4 + C*4 + F*9)
        </Text>
      )}
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
    marginBottom: spacing.md,
  },
  autoCalcContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  macroField: {
    flex: 1,
    gap: spacing.xs,
  },
  input: {
    textAlign: 'center',
  },
  miniProgress: {
    height: 4,
    borderRadius: 2,
    marginTop: spacing.xs,
  },
  calculatedCalories: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
