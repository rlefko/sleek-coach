import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme, spacing } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface GoalCardProps {
  title: string;
  description: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  title,
  description,
  icon,
  selected,
  onPress,
}) => {
  const { theme } = useAppTheme();

  return (
    <Pressable onPress={onPress}>
      <Surface
        style={[
          styles.container,
          {
            backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface,
            borderColor: selected ? theme.colors.primary : theme.colors.outline,
          },
        ]}
        elevation={selected ? 2 : 1}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceVariant,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={28}
            color={selected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
          />
        </View>
        <View style={styles.textContainer}>
          <Text
            variant="titleMedium"
            style={{ color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurface }}
          >
            {title}
          </Text>
          <Text
            variant="bodySmall"
            style={{
              color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
            }}
          >
            {description}
          </Text>
        </View>
        {selected && (
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color={theme.colors.primary}
            style={styles.checkIcon}
          />
        )}
      </Surface>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  checkIcon: {
    marginLeft: spacing.sm,
  },
});
