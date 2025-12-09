import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { spacing } from '@/theme';

interface DisclaimerBannerProps {
  disclaimers: string[];
  variant?: 'info' | 'warning';
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  disclaimers,
  variant = 'info',
}) => {
  const theme = useTheme();

  if (!disclaimers || disclaimers.length === 0) return null;

  const backgroundColor =
    variant === 'warning' ? theme.colors.errorContainer : theme.colors.secondaryContainer;
  const textColor =
    variant === 'warning' ? theme.colors.onErrorContainer : theme.colors.onSecondaryContainer;
  const iconName = variant === 'warning' ? 'alert-circle' : 'information';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Icon name={iconName} size={18} color={textColor} style={styles.icon} />
      <View style={styles.textContainer}>
        {disclaimers.map((disclaimer, index) => (
          <Text key={index} variant="bodySmall" style={[styles.text, { color: textColor }]}>
            {disclaimer}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.sm,
    borderRadius: 8,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  icon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  text: {
    lineHeight: 18,
  },
});
