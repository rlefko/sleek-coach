import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, SegmentedButtons, Menu } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/components/ui';
import { OnboardingProgressBar } from '@/components/onboarding';
import { useAppTheme, spacing } from '@/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import {
  baselineMetricsSchema,
  BaselineMetricsData,
  activityLevelLabels,
  ActivityLevel,
  Sex,
} from '@/schemas/onboardingSchemas';
import type { OnboardingScreenProps } from '@/navigation/types';

type Props = OnboardingScreenProps<'BaselineMetrics'>;

export const BaselineMetricsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const { currentStep, totalSteps, data, updateData } = useOnboardingStore();
  const [activityMenuVisible, setActivityMenuVisible] = React.useState(false);

  const showTargetWeight = data.goalType === 'fat_loss' || data.goalType === 'muscle_gain';

  const {
    control,
    handleSubmit,
    formState: { isValid, errors, touchedFields },
  } = useForm<BaselineMetricsData>({
    resolver: zodResolver(baselineMetricsSchema),
    defaultValues: {
      currentWeightKg: data.currentWeightKg,
      targetWeightKg: data.targetWeightKg ?? undefined,
      heightCm: data.heightCm,
      birthYear: data.birthYear,
      sex: data.sex,
      activityLevel: data.activityLevel,
    },
    mode: 'onChange',
  });

  const onSubmit = (formData: BaselineMetricsData) => {
    updateData({
      currentWeightKg: formData.currentWeightKg,
      heightCm: formData.heightCm,
      birthYear: formData.birthYear,
      sex: formData.sex,
      activityLevel: formData.activityLevel,
      targetWeightKg: formData.targetWeightKg ?? undefined,
    });
    navigation.navigate('TimelinePreferences');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const currentYear = new Date().getFullYear();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />

          <Text variant="headlineMedium" style={styles.title}>
            Tell us about yourself
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            We'll use this to calculate your personalized targets.
          </Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Controller
              control={control}
              name="currentWeightKg"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Current Weight (kg)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  error={errors.currentWeightKg?.message}
                  touched={touchedFields.currentWeightKg}
                />
              )}
            />

            {showTargetWeight && (
              <Controller
                control={control}
                name="targetWeightKg"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Target Weight (kg)"
                    value={value?.toString() || ''}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                    onBlur={onBlur}
                    keyboardType="decimal-pad"
                    error={errors.targetWeightKg?.message}
                    touched={touchedFields.targetWeightKg}
                  />
                )}
              />
            )}

            <Controller
              control={control}
              name="heightCm"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Height (cm)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  error={errors.heightCm?.message}
                  touched={touchedFields.heightCm}
                />
              )}
            />

            <Controller
              control={control}
              name="birthYear"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Birth Year"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseInt(text, 10) : undefined)}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  error={errors.birthYear?.message}
                  touched={touchedFields.birthYear}
                  placeholder={`e.g., ${currentYear - 30}`}
                />
              )}
            />

            <View style={styles.fieldContainer}>
              <Text
                variant="labelLarge"
                style={[styles.fieldLabel, { color: theme.colors.onSurface }]}
              >
                Sex
              </Text>
              <Controller
                control={control}
                name="sex"
                render={({ field: { onChange, value } }) => (
                  <SegmentedButtons
                    value={value || ''}
                    onValueChange={(val) => onChange(val as Sex)}
                    buttons={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'other', label: 'Other' },
                    ]}
                    style={styles.segmentedButtons}
                  />
                )}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text
                variant="labelLarge"
                style={[styles.fieldLabel, { color: theme.colors.onSurface }]}
              >
                Activity Level
              </Text>
              <Controller
                control={control}
                name="activityLevel"
                render={({ field: { onChange, value } }) => (
                  <Menu
                    visible={activityMenuVisible}
                    onDismiss={() => setActivityMenuVisible(false)}
                    anchor={
                      <Button
                        variant="secondary"
                        fullWidth
                        onPress={() => setActivityMenuVisible(true)}
                      >
                        {value
                          ? `${activityLevelLabels[value].title} - ${activityLevelLabels[value].description}`
                          : 'Select activity level'}
                      </Button>
                    }
                    contentStyle={{ backgroundColor: theme.colors.surface }}
                  >
                    {(
                      Object.entries(activityLevelLabels) as [
                        ActivityLevel,
                        { title: string; description: string },
                      ][]
                    ).map(([level, { title, description }]) => (
                      <Menu.Item
                        key={level}
                        onPress={() => {
                          onChange(level);
                          setActivityMenuVisible(false);
                        }}
                        title={`${title} - ${description}`}
                        leadingIcon={value === level ? 'check' : undefined}
                      />
                    ))}
                  </Menu>
                )}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.buttonRow}>
              <Button variant="text" onPress={handleBack}>
                Back
              </Button>
              <Button
                variant="primary"
                onPress={handleSubmit(onSubmit)}
                disabled={!isValid}
                style={styles.continueButton}
              >
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
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    marginBottom: spacing.xs,
  },
  segmentedButtons: {
    marginTop: spacing.xs,
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
