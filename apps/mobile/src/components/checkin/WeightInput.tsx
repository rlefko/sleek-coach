import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, TextInput } from 'react-native-paper';
import { spacing } from '@/theme';

interface WeightInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  unit: 'kg' | 'lbs';
  lastWeight?: number;
  disabled?: boolean;
}

const MIN_WEIGHT_KG = 20;
const MAX_WEIGHT_KG = 500;
const KG_TO_LBS = 2.20462;

function convertFromKg(value: number, unit: 'kg' | 'lbs'): number {
  return unit === 'lbs' ? value * KG_TO_LBS : value;
}

function convertToKg(value: number, unit: 'kg' | 'lbs'): number {
  return unit === 'lbs' ? value / KG_TO_LBS : value;
}

export const WeightInput: React.FC<WeightInputProps> = ({
  value,
  onChange,
  unit,
  lastWeight,
  disabled = false,
}) => {
  const theme = useTheme();

  // Track the text input value separately for better UX during editing
  const [textValue, setTextValue] = useState<string>('');

  // Sync text value with prop value when prop changes externally
  useEffect(() => {
    if (value !== undefined) {
      const displayValue = convertFromKg(value, unit);
      setTextValue(displayValue.toFixed(1));
    } else {
      setTextValue('');
    }
  }, [value, unit]);

  const displayLastWeight =
    lastWeight !== undefined ? convertFromKg(lastWeight, unit).toFixed(1) : undefined;

  const handleTextChange = useCallback(
    (text: string) => {
      if (disabled) return;

      // Update the display text immediately for responsive feel
      setTextValue(text);

      // Allow empty input
      if (text === '' || text === '.') {
        onChange(undefined);
        return;
      }

      // Parse and validate
      const numericValue = parseFloat(text);
      if (isNaN(numericValue)) return;

      // Convert to kg for storage
      const valueInKg = convertToKg(numericValue, unit);

      // Validate bounds (in kg)
      if (valueInKg >= MIN_WEIGHT_KG && valueInKg <= MAX_WEIGHT_KG) {
        onChange(Math.round(valueInKg * 100) / 100);
      }
    },
    [onChange, unit, disabled]
  );

  const handleBlur = useCallback(() => {
    // On blur, format the value nicely if it's valid
    if (value !== undefined) {
      const displayValue = convertFromKg(value, unit);
      setTextValue(displayValue.toFixed(1));
    }
  }, [value, unit]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          Weight
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          keyboardType="decimal-pad"
          value={textValue}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          disabled={disabled}
          style={styles.textInput}
          placeholder={displayLastWeight ?? '--.-'}
          right={<TextInput.Affix text={unit} />}
          contentStyle={styles.textInputContent}
        />
      </View>

      {displayLastWeight && (
        <Text
          variant="bodySmall"
          style={[styles.lastWeight, { color: theme.colors.onSurfaceVariant }]}
        >
          Last: {displayLastWeight} {unit}
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
    justifyContent: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 200,
  },
  textInput: {
    textAlign: 'center',
  },
  textInputContent: {
    textAlign: 'center',
    fontSize: 24,
  },
  lastWeight: {
    marginTop: spacing.sm,
  },
});
