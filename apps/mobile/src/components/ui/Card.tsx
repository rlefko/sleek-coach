import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';
import { spacing } from '@/theme';

type CardVariant = 'elevated' | 'outlined' | 'contained';

interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  style,
  children,
  onPress,
  onLongPress,
}) => {
  return (
    <PaperCard
      mode={variant}
      style={[styles.card, style]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {children}
    </PaperCard>
  );
};

// Re-export Card subcomponents for convenience
export const CardContent = PaperCard.Content;
export const CardTitle = PaperCard.Title;
export const CardActions = PaperCard.Actions;
export const CardCover = PaperCard.Cover;

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.sm,
    borderRadius: 12,
  },
});
