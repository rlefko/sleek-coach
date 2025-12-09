import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { TextInput, HelperText, TextInputProps } from 'react-native-paper';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { spacing } from '@/theme';

interface FormInputProps<T extends FieldValues> extends Omit<
  TextInputProps,
  'value' | 'onChangeText'
> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  containerStyle?: ViewStyle;
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  containerStyle,
  style,
  ...props
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={[styles.container, containerStyle]}>
          <TextInput
            mode="outlined"
            label={label}
            value={value?.toString() ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!error}
            style={[styles.input, style as TextStyle]}
            {...props}
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
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: 'transparent',
  },
});
