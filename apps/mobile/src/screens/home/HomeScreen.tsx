import React, { useCallback, useMemo } from 'react';
import { StyleSheet, ScrollView, RefreshControl, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme, spacing } from '@/theme';
import { useUser, useLatestCheckin, useCheckins, useNutritionDay } from '@/services/hooks';
import { useUIStore } from '@/stores/uiStore';
import {
  DailySummaryCard,
  StreakDisplay,
  QuickActionFAB,
  NextBestActionCard,
  determineNextBestAction,
} from '@/components/home';
import { SyncStatusIndicator } from '@/components/common';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import type { HomeStackParamList, MainTabParamList } from '@/navigation/types';

type HomeNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

function formatToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getThirtyDaysAgo(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

function calculateStreak(checkins: { date: string }[]): { current: number; longest: number } {
  if (!checkins.length) return { current: 0, longest: 0 };

  const dates = checkins
    .map((c) => c.date)
    .sort()
    .reverse();
  const today = formatToday();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let current = 0;
  let longest = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  // Check if streak is active (today or yesterday has a check-in)
  const hasToday = dates.includes(today);
  const hasYesterday = dates.includes(yesterdayStr);
  const streakActive = hasToday || hasYesterday;

  for (const dateStr of dates) {
    const date = new Date(dateStr);
    if (lastDate === null) {
      tempStreak = 1;
    } else {
      const diff = Math.floor((lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        tempStreak++;
      } else {
        longest = Math.max(longest, tempStreak);
        tempStreak = 1;
      }
    }
    lastDate = date;
  }
  longest = Math.max(longest, tempStreak);

  if (streakActive) {
    // Calculate current streak from today/yesterday backwards
    let checkDate = hasToday ? new Date(today) : new Date(yesterdayStr);
    current = 0;
    while (dates.includes(checkDate.toISOString().split('T')[0])) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  return { current, longest };
}

export const HomeScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<HomeNavigationProp>();
  const unitSystem = useUIStore((s) => s.unitSystem);

  const { data: user, isLoading: userLoading } = useUser();
  const {
    data: latestCheckin,
    isLoading: checkinLoading,
    refetch: refetchCheckin,
  } = useLatestCheckin();
  const { data: checkinsData, refetch: refetchCheckins } = useCheckins({
    from: getThirtyDaysAgo(),
    to: formatToday(),
  });
  const { data: todayNutrition, refetch: refetchNutrition } = useNutritionDay(formatToday());

  const isLoading = userLoading || checkinLoading;

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCheckin(), refetchCheckins(), refetchNutrition()]);
    setRefreshing(false);
  }, [refetchCheckin, refetchCheckins, refetchNutrition]);

  const displayName = user?.profile?.display_name || user?.email?.split('@')[0] || 'there';

  const todayStr = formatToday();
  const hasCheckinToday = latestCheckin?.date === todayStr;
  const hasNutritionToday = !!todayNutrition;

  const streak = useMemo(() => {
    return calculateStreak(checkinsData?.items ?? []);
  }, [checkinsData?.items]);

  const macroTargets = user?.preferences?.macro_targets;
  const calorieTarget = macroTargets?.calories;
  const proteinTarget = macroTargets?.protein_g;

  const nextAction = determineNextBestAction(
    hasCheckinToday,
    hasNutritionToday,
    false, // hasRecentPhoto - we'd need to check photos
    !!user?.profile?.height_cm
  );

  const handleLogWeight = useCallback(() => {
    navigation.navigate('CheckIn');
  }, [navigation]);

  const handleLogMeal = useCallback(() => {
    navigation.navigate('NutritionLog');
  }, [navigation]);

  const handleTalkToCoach = useCallback(() => {
    // Navigate to coach tab
    navigation.getParent<NativeStackNavigationProp<MainTabParamList>>()?.navigate('CoachTab', {
      screen: 'Coach',
    });
  }, [navigation]);

  const handleNextAction = useCallback(() => {
    switch (nextAction) {
      case 'log_checkin':
        navigation.navigate('CheckIn');
        break;
      case 'log_nutrition':
        navigation.navigate('NutritionLog');
        break;
      case 'talk_to_coach':
        handleTalkToCoach();
        break;
      default:
        navigation.navigate('CheckIn');
    }
  }, [nextAction, navigation, handleTalkToCoach]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
              Hey, {displayName}!
            </Text>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <SyncStatusIndicator />
        </View>

        <StreakDisplay currentStreak={streak.current} longestStreak={streak.longest} />

        <DailySummaryCard
          todayWeight={hasCheckinToday ? (latestCheckin?.weight_kg ?? undefined) : undefined}
          previousWeight={!hasCheckinToday ? (latestCheckin?.weight_kg ?? undefined) : undefined}
          calories={todayNutrition?.calories ?? undefined}
          calorieTarget={calorieTarget}
          protein={todayNutrition?.protein_g ?? undefined}
          proteinTarget={proteinTarget}
          checkinCompleted={hasCheckinToday}
          unit={unitSystem === 'imperial' ? 'lbs' : 'kg'}
          onPress={handleLogWeight}
        />

        <NextBestActionCard actionType={nextAction} onPress={handleNextAction} />

        {!hasCheckinToday && !hasNutritionToday && checkinsData?.items.length === 0 && (
          <EmptyState
            icon="rocket-launch"
            title="Start Your Journey"
            description="Log your first check-in to begin tracking your progress"
          />
        )}
      </ScrollView>

      <QuickActionFAB
        onLogWeight={handleLogWeight}
        onLogMeal={handleLogMeal}
        onTalkToCoach={handleTalkToCoach}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100, // Space for FAB
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
});
