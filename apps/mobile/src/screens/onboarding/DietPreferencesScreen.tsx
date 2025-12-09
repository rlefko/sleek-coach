import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Button } from '@/components/ui';
import { OnboardingProgressBar, TagInput } from '@/components/onboarding';
import { useAppTheme, spacing } from '@/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { dietTypeLabels, DietType } from '@/schemas/onboardingSchemas';
import type { OnboardingScreenProps } from '@/navigation/types';

type Props = OnboardingScreenProps<'DietPreferences'>;

export const DietPreferencesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const { currentStep, totalSteps, data, updateData } = useOnboardingStore();

  const handleDietTypeSelect = (dietType: DietType) => {
    updateData({ dietType });
  };

  const handleAllergiesChange = (allergies: string[]) => {
    updateData({ allergies });
  };

  const handleDislikedFoodsChange = (dislikedFoods: string[]) => {
    updateData({ dislikedFoods });
  };

  const handleMealsPerDayChange = (mealsPerDay: number) => {
    updateData({ mealsPerDay: Math.round(mealsPerDay) });
  };

  const handleContinue = () => {
    navigation.navigate('PrivacySettings');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const dietTypes = Object.entries(dietTypeLabels) as [DietType, string][];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />

          <Text variant="headlineMedium" style={styles.title}>
            Diet preferences
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Help us personalize meal suggestions for you.
          </Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text
                variant="labelLarge"
                style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
              >
                Dietary Restrictions
              </Text>
              <View style={styles.chipContainer}>
                {dietTypes.map(([type, label]) => (
                  <Chip
                    key={type}
                    selected={data.dietType === type}
                    onPress={() => handleDietTypeSelect(type)}
                    style={styles.chip}
                    showSelectedCheck
                  >
                    {label}
                  </Chip>
                ))}
              </View>
            </View>

            <TagInput
              label="Allergies"
              value={data.allergies || []}
              onChange={handleAllergiesChange}
              placeholder="Add allergy and press Enter"
            />

            <TagInput
              label="Foods you dislike"
              value={data.dislikedFoods || []}
              onChange={handleDislikedFoodsChange}
              placeholder="Add food and press Enter"
            />

            <View style={styles.section}>
              <Text
                variant="labelLarge"
                style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
              >
                Meals per day: {data.mealsPerDay || 3}
              </Text>
              <Slider
                value={data.mealsPerDay || 3}
                onValueChange={handleMealsPerDayChange}
                minimumValue={1}
                maximumValue={6}
                step={1}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.surfaceVariant}
                thumbTintColor={theme.colors.primary}
                style={styles.slider}
              />
              <View style={styles.sliderLabels}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  1
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  6
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              <Button variant="text" onPress={handleBack}>
                Back
              </Button>
              <Button variant="primary" onPress={handleContinue} style={styles.continueButton}>
                Continue
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    marginBottom: spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
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
