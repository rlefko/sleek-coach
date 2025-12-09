import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import { spacing, borderRadius } from '@/theme';

export type ActionType =
  | 'log_checkin'
  | 'log_nutrition'
  | 'view_progress'
  | 'talk_to_coach'
  | 'complete_profile'
  | 'upload_photo';

interface NextBestActionCardProps {
  actionType: ActionType;
  onPress: () => void;
}

const ACTION_CONFIG: Record<ActionType, { icon: string; title: string; description: string }> = {
  log_checkin: {
    icon: 'scale-bathroom',
    title: "Log Today's Check-in",
    description: "Track your weight and how you're feeling today",
  },
  log_nutrition: {
    icon: 'food-apple',
    title: 'Log Your Meals',
    description: 'Keep your nutrition on track by logging what you eat',
  },
  view_progress: {
    icon: 'chart-line',
    title: 'Check Your Progress',
    description: "See how far you've come with your goals",
  },
  talk_to_coach: {
    icon: 'robot',
    title: 'Talk to Your Coach',
    description: 'Get personalized advice and guidance',
  },
  complete_profile: {
    icon: 'account-edit',
    title: 'Complete Your Profile',
    description: 'Add more details to get better recommendations',
  },
  upload_photo: {
    icon: 'camera',
    title: 'Take a Progress Photo',
    description: 'Capture your journey with a new photo',
  },
};

export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({ actionType, onPress }) => {
  const theme = useTheme();
  const config = ACTION_CONFIG[actionType];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.colors.secondaryContainer,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <IconButton
        icon={config.icon}
        size={32}
        iconColor={theme.colors.onSecondaryContainer}
        style={styles.icon}
      />
      <View style={styles.content}>
        <Text variant="titleSmall" style={{ color: theme.colors.onSecondaryContainer }}>
          {config.title}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSecondaryContainer, opacity: 0.8 }}
        >
          {config.description}
        </Text>
      </View>
      <IconButton icon="chevron-right" size={24} iconColor={theme.colors.onSecondaryContainer} />
    </Pressable>
  );
};

export function determineNextBestAction(
  hasCheckinToday: boolean,
  hasNutritionToday: boolean,
  hasRecentPhoto: boolean,
  profileComplete: boolean
): ActionType {
  if (!profileComplete) return 'complete_profile';
  if (!hasCheckinToday) return 'log_checkin';
  if (!hasNutritionToday) return 'log_nutrition';
  if (!hasRecentPhoto) return 'upload_photo';
  return 'view_progress';
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.sm,
  },
  icon: {
    margin: 0,
  },
  content: {
    flex: 1,
    marginLeft: spacing.sm,
  },
});
