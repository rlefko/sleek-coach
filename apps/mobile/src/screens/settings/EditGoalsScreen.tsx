import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { useAppTheme, spacing } from '@/theme';
import { useUser, useUpdateGoals } from '@/services/hooks/useUser';
import {
  goalTypeEnum,
  pacePreferenceEnum,
  goalTypeLabels,
  pacePreferenceLabels,
  type GoalType,
  type PacePreference,
} from '@/schemas/onboardingSchemas';
import type { SettingsScreenProps } from '@/navigation/types';

type Props = SettingsScreenProps<'EditGoals'>;

const editGoalsSchema = z.object({
  goal_type: goalTypeEnum,
  target_weight_kg: z.number().min(20).max(500).optional().nullable(),
  pace_preference: pacePreferenceEnum,
  target_date: z.string().optional().nullable(),
});

type EditGoalsData = z.infer<typeof editGoalsSchema>;

export const EditGoalsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const { data: user, isLoading: isLoadingUser } = useUser();
  const updateGoals = useUpdateGoals();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isValid, isDirty },
  } = useForm<EditGoalsData>({
    resolver: zodResolver(editGoalsSchema),
    defaultValues: {
      goal_type: (user?.goal?.goal_type as GoalType) ?? 'maintenance',
      target_weight_kg: user?.goal?.target_weight_kg ?? undefined,
      pace_preference: (user?.goal?.pace_preference as PacePreference) ?? 'moderate',
      target_date: user?.goal?.target_date ?? undefined,
    },
    mode: 'onChange',
  });

  const goalType = watch('goal_type');
  const showTargetWeight = goalType === 'fat_loss' || goalType === 'muscle_gain';

  const onSubmit = async (formData: EditGoalsData) => {
    try {
      await updateGoals.mutateAsync({
        goal_type: formData.goal_type,
        target_weight_kg: showTargetWeight ? formData.target_weight_kg : null,
        pace_preference: formData.pace_preference,
        target_date: formData.target_date || null,
      });
      navigation.goBack();
    } catch {
      // Error is handled by mutation
    }
  };

  if (isLoadingUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Edit Goals
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Update your fitness goals
          </Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.fieldContainer}>
              <Text
                variant="labelLarge"
                style={[styles.fieldLabel, { color: theme.colors.onSurface }]}
              >
                Goal Type
              </Text>
              <Controller
                control={control}
                name="goal_type"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.goalOptions}>
                    {(Object.keys(goalTypeLabels) as GoalType[]).map((goal) => (
                      <Button
                        key={goal}
                        variant={value === goal ? 'primary' : 'secondary'}
                        onPress={() => onChange(goal)}
                        style={styles.goalButton}
                      >
                        {goalTypeLabels[goal].title}
                      </Button>
                    ))}
                  </View>
                )}
              />
            </View>

            {showTargetWeight && (
              <Controller
                control={control}
                name="target_weight_kg"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Target Weight (kg)"
                    value={value?.toString() || ''}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                    onBlur={onBlur}
                    keyboardType="decimal-pad"
                  />
                )}
              />
            )}

            <View style={styles.fieldContainer}>
              <Text
                variant="labelLarge"
                style={[styles.fieldLabel, { color: theme.colors.onSurface }]}
              >
                Pace Preference
              </Text>
              <Controller
                control={control}
                name="pace_preference"
                render={({ field: { onChange, value } }) => (
                  <SegmentedButtons
                    value={value}
                    onValueChange={(val) => onChange(val as PacePreference)}
                    buttons={[
                      { value: 'slow', label: pacePreferenceLabels.slow.title },
                      { value: 'moderate', label: pacePreferenceLabels.moderate.title },
                      { value: 'aggressive', label: pacePreferenceLabels.aggressive.title },
                    ]}
                    style={styles.segmentedButtons}
                  />
                )}
              />
              <Text
                variant="bodySmall"
                style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}
              >
                {pacePreferenceLabels[watch('pace_preference')].description}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {updateGoals.error && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                Failed to update goals. Please try again.
              </Text>
            )}
            <View style={styles.buttonRow}>
              <Button variant="text" onPress={() => navigation.goBack()}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleSubmit(onSubmit)}
                disabled={!isValid || !isDirty || updateGoals.isPending}
                loading={updateGoals.isPending}
                style={styles.saveButton}
              >
                Save
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    marginBottom: spacing.sm,
  },
  goalOptions: {
    gap: spacing.sm,
  },
  goalButton: {
    marginBottom: spacing.xs,
  },
  segmentedButtons: {
    marginTop: spacing.xs,
  },
  helperText: {
    marginTop: spacing.xs,
  },
  footer: {
    paddingTop: spacing.md,
  },
  errorText: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    marginLeft: spacing.md,
  },
});
