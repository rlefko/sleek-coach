import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, HelperText } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { useAppTheme, spacing } from '@/theme';

interface FormSliderProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  formatValue?: (value: number) => string;
  containerStyle?: ViewStyle;
}

export function FormSlider<T extends FieldValues>({
  control,
  name,
  label,
  minimumValue,
  maximumValue,
  step = 1,
  formatValue = (v) => v.toString(),
  containerStyle,
}: FormSliderProps<T>) {
  const { theme } = useAppTheme();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={[styles.container, containerStyle]}>
          <View style={styles.labelRow}>
            <Text variant="bodyMedium">{label}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              {formatValue(value ?? minimumValue)}
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={minimumValue}
            maximumValue={maximumValue}
            step={step}
            value={value ?? minimumValue}
            onValueChange={onChange}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.outlineVariant}
            thumbTintColor={theme.colors.primary}
          />
          {error && (
            <HelperText type="error" visible={!!error}>
              {error.message}
            </HelperText>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
