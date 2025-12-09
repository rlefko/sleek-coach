import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { spacing } from '@/theme';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak?: number;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({ currentStreak, longestStreak }) => {
  const theme = useTheme();

  const isNewRecord =
    longestStreak !== undefined && currentStreak >= longestStreak && currentStreak > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primaryContainer }]}>
      <View style={styles.mainStreak}>
        <Text style={styles.fireEmoji}>{currentStreak > 0 ? '' : ''}</Text>
        <Text
          variant="headlineMedium"
          style={[styles.streakNumber, { color: theme.colors.onPrimaryContainer }]}
        >
          {currentStreak}
        </Text>
        <Text variant="labelLarge" style={{ color: theme.colors.onPrimaryContainer }}>
          day streak
        </Text>
      </View>

      {isNewRecord && (
        <View style={[styles.recordBadge, { backgroundColor: theme.colors.tertiary }]}>
          <Text variant="labelSmall" style={{ color: theme.colors.onTertiary }}>
            Personal Best!
          </Text>
        </View>
      )}

      {longestStreak !== undefined && !isNewRecord && longestStreak > 0 && (
        <Text
          variant="labelSmall"
          style={[styles.bestStreak, { color: theme.colors.onPrimaryContainer }]}
        >
          Best: {longestStreak} days
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 16,
    marginVertical: spacing.sm,
  },
  mainStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fireEmoji: {
    fontSize: 28,
  },
  streakNumber: {
    fontWeight: '700',
  },
  recordBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  bestStreak: {
    opacity: 0.8,
  },
});
