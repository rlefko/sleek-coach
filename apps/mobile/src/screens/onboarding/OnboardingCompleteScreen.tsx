import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { OnboardingProgressBar } from '@/components/onboarding';
import { useAppTheme, spacing } from '@/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useSubmitOnboarding } from '@/services/hooks/useOnboarding';
import {
  goalTypeLabels,
  activityLevelLabels,
  pacePreferenceLabels,
  dietTypeLabels,
} from '@/schemas/onboardingSchemas';
import type { OnboardingScreenProps } from '@/navigation/types';

type Props = OnboardingScreenProps<'OnboardingComplete'>;

interface SummaryItemProps {
  label: string;
  value: string;
}

const SummaryItem: React.FC<SummaryItemProps> = ({ label, value }) => {
  const { theme } = useAppTheme();
  return (
    <View style={styles.summaryItem}>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
        {value}
      </Text>
    </View>
  );
};

export const OnboardingCompleteScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const { currentStep, totalSteps, data } = useOnboardingStore();
  const submitOnboarding = useSubmitOnboarding();

  const handleGetStarted = async () => {
    await submitOnboarding.mutateAsync();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const currentYear = new Date().getFullYear();
  const age = data.birthYear ? currentYear - data.birthYear : undefined;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />

        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="check-circle" size={48} color={theme.colors.primary} />
          </View>
          <Text variant="headlineMedium" style={styles.title}>
            You're all set!
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Here's a summary of your profile.
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Your Goal
            </Text>
            <Divider style={styles.divider} />
            {data.goalType && (
              <SummaryItem label="Goal" value={goalTypeLabels[data.goalType].title} />
            )}
            {data.pacePreference && (
              <SummaryItem label="Pace" value={pacePreferenceLabels[data.pacePreference].title} />
            )}
          </Surface>

          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Your Stats
            </Text>
            <Divider style={styles.divider} />
            {data.currentWeightKg && (
              <SummaryItem label="Current Weight" value={`${data.currentWeightKg} kg`} />
            )}
            {data.targetWeightKg && (
              <SummaryItem label="Target Weight" value={`${data.targetWeightKg} kg`} />
            )}
            {data.heightCm && <SummaryItem label="Height" value={`${data.heightCm} cm`} />}
            {age && <SummaryItem label="Age" value={`${age} years`} />}
            {data.activityLevel && (
              <SummaryItem
                label="Activity Level"
                value={activityLevelLabels[data.activityLevel].title}
              />
            )}
          </Surface>

          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Preferences
            </Text>
            <Divider style={styles.divider} />
            {data.dietType && <SummaryItem label="Diet" value={dietTypeLabels[data.dietType]} />}
            {data.mealsPerDay && (
              <SummaryItem label="Meals per Day" value={`${data.mealsPerDay}`} />
            )}
            {data.allergies && data.allergies.length > 0 && (
              <SummaryItem label="Allergies" value={data.allergies.join(', ')} />
            )}
          </Surface>
        </ScrollView>

        <View style={styles.footer}>
          {submitOnboarding.isError && (
            <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
              Something went wrong. Please try again.
            </Text>
          )}
          <View style={styles.buttonRow}>
            <Button variant="text" onPress={handleBack} disabled={submitOnboarding.isPending}>
              Back
            </Button>
            <Button
              variant="primary"
              onPress={handleGetStarted}
              loading={submitOnboarding.isPending}
              disabled={submitOnboarding.isPending}
              style={styles.continueButton}
            >
              Get Started
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  card: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    marginBottom: spacing.xs,
  },
  divider: {
    marginBottom: spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  footer: {
    paddingTop: spacing.md,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  continueButton: {
    flex: 1,
    marginLeft: spacing.md,
  },
});
