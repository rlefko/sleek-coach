import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { OnboardingProgressBar, GoalCard } from '@/components/onboarding';
import { useAppTheme, spacing } from '@/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { goalTypeLabels, GoalType } from '@/schemas/onboardingSchemas';
import type { OnboardingScreenProps } from '@/navigation/types';

type Props = OnboardingScreenProps<'GoalSelection'>;

const goalIcons: Record<
  GoalType,
  'fire' | 'arm-flex' | 'sync' | 'scale-balance' | 'lightning-bolt'
> = {
  fat_loss: 'fire',
  muscle_gain: 'arm-flex',
  recomp: 'sync',
  maintenance: 'scale-balance',
  performance: 'lightning-bolt',
};

export const GoalSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const { currentStep, totalSteps, data, updateData, nextStep } = useOnboardingStore();

  const handleGoalSelect = (goalType: GoalType) => {
    updateData({ goalType });
  };

  const handleContinue = () => {
    if (data.goalType) {
      nextStep();
      navigation.navigate('MeasurementSystem');
    }
  };

  const goals = Object.entries(goalTypeLabels) as [
    GoalType,
    { title: string; description: string },
  ][];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />

        <Text variant="headlineMedium" style={styles.title}>
          What's your goal?
        </Text>
        <Text
          variant="bodyLarge"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Choose your primary fitness goal. You can always change this later.
        </Text>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {goals.map(([goalType, { title, description }]) => (
            <GoalCard
              key={goalType}
              title={title}
              description={description}
              icon={goalIcons[goalType]}
              selected={data.goalType === goalType}
              onPress={() => handleGoalSelect(goalType)}
            />
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Button variant="primary" fullWidth onPress={handleContinue} disabled={!data.goalType}>
            Continue
          </Button>
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
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  footer: {
    paddingTop: spacing.md,
  },
});
