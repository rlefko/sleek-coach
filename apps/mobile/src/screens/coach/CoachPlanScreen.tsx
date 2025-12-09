import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme, spacing } from '@/theme';
import { usePlan, useGeneratePlan } from '@/services/hooks';
import { WeeklyPlanCard } from '@/components/coach';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import type { CoachStackParamList } from '@/navigation/types';

type CoachPlanScreenNavigationProp = NativeStackNavigationProp<CoachStackParamList, 'CoachPlan'>;

export const CoachPlanScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<CoachPlanScreenNavigationProp>();

  const { data: plan, isLoading, isError, error, refetch } = usePlan();

  const generatePlan = useGeneratePlan();

  const handleRegenerate = useCallback(() => {
    generatePlan.mutate(undefined);
  }, [generatePlan]);

  const handleDiscuss = useCallback(() => {
    navigation.navigate('Coach');
  }, [navigation]);

  const handleGenerateFirst = useCallback(() => {
    generatePlan.mutate(undefined);
  }, [generatePlan]);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !plan) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text
            variant="bodyMedium"
            style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}
          >
            Loading your plan...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError && !plan) {
    const is404 = (error as { status?: number })?.status === 404;

    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {is404 ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="calendar-plus"
                title="No Plan Yet"
                description="Generate your first weekly plan to get personalized nutrition targets and recommendations."
              />
              <Button
                mode="contained"
                onPress={handleGenerateFirst}
                loading={generatePlan.isPending}
                disabled={generatePlan.isPending}
                style={styles.generateButton}
              >
                Generate My Plan
              </Button>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="alert-circle-outline"
                title="Something Went Wrong"
                description="We couldn't load your plan. Please try again."
              />
              <Button mode="contained" onPress={() => refetch()} style={styles.generateButton}>
                Try Again
              </Button>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
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
        {plan && (
          <WeeklyPlanCard
            plan={plan}
            onRegenerate={handleRegenerate}
            onDiscuss={handleDiscuss}
            isLoading={generatePlan.isPending}
          />
        )}

        {/* Additional actions */}
        <View style={styles.actionsSection}>
          <Button
            mode="outlined"
            icon="chat-outline"
            onPress={handleDiscuss}
            style={styles.actionButton}
          >
            Discuss with Coach
          </Button>
        </View>

        {/* Disclaimer */}
        <Text
          variant="bodySmall"
          style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}
        >
          These targets are personalized based on your goals and progress. Adjust as needed based on
          how you feel. Consult a healthcare professional before making significant dietary changes.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    marginTop: spacing.sm,
  },
  scrollContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  generateButton: {
    marginTop: spacing.lg,
  },
  actionsSection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    borderRadius: 8,
  },
  disclaimer: {
    marginTop: spacing.lg,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: 18,
  },
});
