import React from 'react';
import { View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { TextInput, HelperText, TextInputProps } from 'react-native-paper';
import { spacing } from '@/theme';

interface InputProps extends Omit<TextInputProps, 'error'> {
  error?: string;
  touched?: boolean;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  error,
  touched,
  containerStyle,
  style,
  ...props
}) => {
  const showError = touched && !!error;

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        mode="outlined"
        error={showError}
        style={[styles.input, style as TextStyle]}
        {...props}
      />
      {showError && (
        <HelperText type="error" visible={showError}>
          {error}
        </HelperText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: 'transparent',
  },
});
