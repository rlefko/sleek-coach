import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Menu, Button, HelperText } from 'react-native-paper';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { useAppTheme, spacing } from '@/theme';

interface SelectOption {
  label: string;
  value: string;
}

interface FormSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: SelectOption[];
  containerStyle?: ViewStyle;
  placeholder?: string;
}

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label: _label,
  options,
  containerStyle,
  placeholder = 'Select an option',
}: FormSelectProps<T>) {
  const { theme } = useAppTheme();
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selectedOption = options.find((opt) => opt.value === value);

        return (
          <View style={[styles.container, containerStyle]}>
            <Menu
              visible={visible}
              onDismiss={() => setVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setVisible(true)}
                  style={[styles.button, error && { borderColor: theme.colors.error }]}
                  contentStyle={styles.buttonContent}
                  icon="chevron-down"
                >
                  {selectedOption?.label ?? placeholder}
                </Button>
              }
            >
              {options.map((option) => (
                <Menu.Item
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    setVisible(false);
                  }}
                  title={option.label}
                />
              ))}
            </Menu>
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
  buttonContent: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
});
