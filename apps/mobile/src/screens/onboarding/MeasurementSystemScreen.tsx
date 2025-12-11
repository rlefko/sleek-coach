import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { OnboardingProgressBar } from '@/components/onboarding';
import { useAppTheme, spacing } from '@/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUIStore } from '@/stores/uiStore';
import type { OnboardingScreenProps } from '@/navigation/types';

type Props = OnboardingScreenProps<'MeasurementSystem'>;

type MeasurementSystemType = 'metric' | 'imperial';

const measurementOptions: {
  value: MeasurementSystemType;
  title: string;
  description: string;
}[] = [
  {
    value: 'metric',
    title: 'Metric',
    description: 'Kilograms (kg) and centimeters (cm)',
  },
  {
    value: 'imperial',
    title: 'Imperial',
    description: 'Pounds (lbs) and inches (in)',
  },
];

export const MeasurementSystemScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const { currentStep, totalSteps, data, updateData, nextStep } = useOnboardingStore();
  const setUnitSystem = useUIStore((s) => s.setUnitSystem);

  const handleSelect = (system: MeasurementSystemType) => {
    updateData({ measurementSystem: system });
    setUnitSystem(system);
  };

  const handleContinue = () => {
    nextStep();
    navigation.navigate('BaselineMetrics');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />

        <Text variant="headlineMedium" style={styles.title}>
          Choose your units
        </Text>
        <Text
          variant="bodyLarge"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Select your preferred measurement system. You can change this later in settings.
        </Text>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {measurementOptions.map(({ value, title, description }) => (
            <Surface
              key={value}
              style={[
                styles.optionCard,
                {
                  backgroundColor:
                    data.measurementSystem === value
                      ? theme.colors.primaryContainer
                      : theme.colors.surface,
                  borderColor:
                    data.measurementSystem === value ? theme.colors.primary : theme.colors.outline,
                },
              ]}
              elevation={data.measurementSystem === value ? 2 : 1}
              onTouchEnd={() => handleSelect(value)}
            >
              <View style={styles.optionContent}>
                <Text
                  variant="titleMedium"
                  style={{
                    color:
                      data.measurementSystem === value
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
                      data.measurementSystem === value
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant,
                  }}
                >
                  {description}
                </Text>
              </View>
              {data.measurementSystem === value && (
                <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                  <Text style={{ color: theme.colors.onPrimary }}>✓</Text>
                </View>
              )}
            </Surface>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.buttonRow}>
            <Button variant="text" onPress={handleBack}>
              Back
            </Button>
            <Button
              variant="primary"
              onPress={handleContinue}
              disabled={!data.measurementSystem}
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
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  optionContent: {
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
