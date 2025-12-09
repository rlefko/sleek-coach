import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Chip as PaperChip, ChipProps as PaperChipProps } from 'react-native-paper';
import { useAppTheme } from '@/theme';

interface ChipProps extends Omit<PaperChipProps, 'mode'> {
  variant?: 'flat' | 'outlined';
}

export const Chip: React.FC<ChipProps> = ({ variant = 'outlined', selected, style, ...props }) => {
  const { theme } = useAppTheme();

  return (
    <PaperChip
      mode={variant}
      selected={selected}
      style={[
        styles.chip,
        selected && { backgroundColor: theme.colors.primaryContainer },
        style as ViewStyle,
      ]}
      selectedColor={theme.colors.primary}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
});
