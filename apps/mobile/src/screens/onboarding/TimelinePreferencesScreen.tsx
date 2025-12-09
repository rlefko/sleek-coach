import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { OnboardingProgressBar } from '@/components/onboarding';
import { useAppTheme, spacing } from '@/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { pacePreferenceLabels, PacePreference } from '@/schemas/onboardingSchemas';
import type { OnboardingScreenProps } from '@/navigation/types';

type Props = OnboardingScreenProps<'TimelinePreferences'>;

export const TimelinePreferencesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const { currentStep, totalSteps, data, updateData } = useOnboardingStore();

  const handlePaceSelect = (pace: PacePreference) => {
    updateData({ pacePreference: pace });
  };

  const handleContinue = () => {
    navigation.navigate('DietPreferences');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const paces = Object.entries(pacePreferenceLabels) as [
    PacePreference,
    { title: string; description: string },
  ][];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />

        <Text variant="headlineMedium" style={styles.title}>
          Choose your pace
        </Text>
        <Text
          variant="bodyLarge"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          How quickly do you want to see results? A slower pace is easier to maintain.
        </Text>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {paces.map(([pace, { title, description }]) => (
            <Surface
              key={pace}
              style={[
                styles.paceCard,
                {
                  backgroundColor:
                    data.pacePreference === pace
                      ? theme.colors.primaryContainer
                      : theme.colors.surface,
                  borderColor:
                    data.pacePreference === pace ? theme.colors.primary : theme.colors.outline,
                },
              ]}
              elevation={data.pacePreference === pace ? 2 : 1}
              onTouchEnd={() => handlePaceSelect(pace)}
            >
              <View style={styles.paceContent}>
                <Text
                  variant="titleMedium"
                  style={{
                    color:
                      data.pacePreference === pace
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurface,
                  }}
                >
                  {title}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{
                    color:
                      data.pacePreference === pace
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant,
                  }}
                >
                  {description}
                </Text>
              </View>
              {data.pacePreference === pace && (
                <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                  <Text style={{ color: theme.colors.onPrimary }}>✓</Text>
                </View>
              )}
            </Surface>
          ))}

          <View style={styles.infoBox}>
            <Text
              variant="bodySmall"
              style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}
            >
              Your recommended calorie and macro targets will be adjusted based on your pace
              preference. You can always change this later in settings.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.buttonRow}>
            <Button variant="text" onPress={handleBack}>
              Back
            </Button>
            <Button
              variant="primary"
              onPress={handleContinue}
              disabled={!data.pacePreference}
              style={styles.continueButton}
            >
              Continue
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
  paceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  paceContent: {
    flex: 1,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  infoBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
  },
  infoText: {
    textAlign: 'center',
  },
  footer: {
    paddingTop: spacing.md,
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
