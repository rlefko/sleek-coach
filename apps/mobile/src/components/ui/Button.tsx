import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Button as PaperButton, ButtonProps as PaperButtonProps } from 'react-native-paper';

type ButtonVariant = 'primary' | 'secondary' | 'text';

interface ButtonProps extends Omit<PaperButtonProps, 'mode'> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantToMode: Record<ButtonVariant, PaperButtonProps['mode']> = {
  primary: 'contained',
  secondary: 'outlined',
  text: 'text',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  style,
  contentStyle,
  ...props
}) => {
  const mode = variantToMode[variant];

  return (
    <PaperButton
      mode={mode}
      style={[styles.button, fullWidth && styles.fullWidth, style as ViewStyle]}
      contentStyle={[styles.content, contentStyle]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    paddingVertical: 4,
  },
});
