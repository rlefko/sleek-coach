import React, { useState } from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { Button, HelperText } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { useAppTheme, spacing } from '@/theme';

interface FormDatePickerProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  minimumDate?: Date;
  maximumDate?: Date;
  containerStyle?: ViewStyle;
}

export function FormDatePicker<T extends FieldValues>({
  control,
  name,
  label,
  minimumDate,
  maximumDate,
  containerStyle,
}: FormDatePickerProps<T>) {
  const { theme } = useAppTheme();
  const [show, setShow] = useState(false);

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'Select date';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const currentDate = value ? new Date(value) : new Date();

        const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
          if (Platform.OS === 'android') {
            setShow(false);
          }
          if (selectedDate) {
            onChange(selectedDate.toISOString().split('T')[0]);
          }
        };

        return (
          <View style={[styles.container, containerStyle]}>
            <Button
              mode="outlined"
              onPress={() => setShow(true)}
              style={[styles.button, error && { borderColor: theme.colors.error }]}
              icon="calendar"
            >
              {label}: {formatDate(value)}
            </Button>
            {show && (
              <DateTimePicker
                value={currentDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
              />
            )}
            {error && (
              <HelperText type="error" visible={!!error}>
                {error.message}
              </HelperText>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  button: {
    justifyContent: 'flex-start',
  },
});
