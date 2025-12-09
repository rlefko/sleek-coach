import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, ScrollView, View, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme, spacing } from '@/theme';
import { useNutritionDay, useLogNutrition, useUser } from '@/services/hooks';
import { useSyncStore } from '@/stores/syncStore';
import { CalorieInput } from '@/components/nutrition/CalorieInput';
import { MacroInput } from '@/components/nutrition/MacroInput';
import { FormDatePicker } from '@/components/forms';
import { Card, CardContent } from '@/components/ui';
import {
  nutritionDaySchema,
  type NutritionDayFormData,
  toNutritionDayCreate,
  calculateCaloriesFromMacros,
} from '@/schemas/nutritionSchemas';

function formatToday(): string {
  return new Date().toISOString().split('T')[0];
}

export const NutritionLogScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation();

  const [selectedDate, setSelectedDate] = useState(formatToday());
  const [autoCalcCalories, setAutoCalcCalories] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const { data: user } = useUser();
  const { data: existingNutrition } = useNutritionDay(selectedDate);
  const logNutrition = useLogNutrition();
  const addPendingNutrition = useSyncStore((s) => s.addPendingNutrition);

  const macroTargets = user?.preferences?.macro_targets;
  const calorieTarget = macroTargets?.calories;
  const proteinTarget = macroTargets?.protein_g;
  const carbsTarget = macroTargets?.carbs_g;
  const fatTarget = macroTargets?.fat_g;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<NutritionDayFormData>({
    resolver: zodResolver(nutritionDaySchema),
    defaultValues: {
      date: selectedDate,
      calories: undefined,
      protein_g: undefined,
      carbs_g: undefined,
      fat_g: undefined,
      fiber_g: undefined,
      notes: '',
    },
  });

  // Load existing nutrition data when date changes
  useEffect(() => {
    if (existingNutrition) {
      reset({
        date: selectedDate,
        calories: existingNutrition.calories ?? undefined,
        protein_g: existingNutrition.protein_g ?? undefined,
        carbs_g: existingNutrition.carbs_g ?? undefined,
        fat_g: existingNutrition.fat_g ?? undefined,
        fiber_g: existingNutrition.fiber_g ?? undefined,
        notes: existingNutrition.notes ?? '',
      });
    } else {
      reset({
        date: selectedDate,
        calories: undefined,
        protein_g: undefined,
        carbs_g: undefined,
        fat_g: undefined,
        fiber_g: undefined,
        notes: '',
      });
    }
  }, [existingNutrition, selectedDate, reset]);

  const watchedDate = watch('date');
  const protein = watch('protein_g');
  const carbs = watch('carbs_g');
  const fat = watch('fat_g');

  // Sync selected date state with form value
  useEffect(() => {
    if (watchedDate && watchedDate !== selectedDate) {
      setSelectedDate(watchedDate);
    }
  }, [watchedDate, selectedDate]);

  const handleCaloriesChange = useCallback(
    (value: number | undefined) => {
      if (!autoCalcCalories) {
        setValue('calories', value);
      }
    },
    [autoCalcCalories, setValue]
  );

  const handleMacrosChange = useCallback(
    (values: { protein?: number; carbs?: number; fat?: number }) => {
      if (values.protein !== undefined) setValue('protein_g', values.protein);
      if (values.carbs !== undefined) setValue('carbs_g', values.carbs);
      if (values.fat !== undefined) setValue('fat_g', values.fat);

      if (autoCalcCalories) {
        const calculated = calculateCaloriesFromMacros(
          values.protein ?? protein,
          values.carbs ?? carbs,
          values.fat ?? fat
        );
        setValue('calories', calculated);
      }
    },
    [autoCalcCalories, setValue, protein, carbs, fat]
  );

  const handleAutoCalcChange = useCallback(
    (enabled: boolean) => {
      setAutoCalcCalories(enabled);
      if (enabled) {
        const calculated = calculateCaloriesFromMacros(protein, carbs, fat);
        setValue('calories', calculated);
      }
    },
    [protein, carbs, fat, setValue]
  );

  const onSubmit = async (data: NutritionDayFormData) => {
    try {
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected && netInfo.isInternetReachable;

      const nutritionData = toNutritionDayCreate(data);

      if (isOnline) {
        await logNutrition.mutateAsync(nutritionData);
        setSnackbarMessage('Nutrition saved!');
      } else {
        addPendingNutrition(nutritionData);
        setSnackbarMessage('Saved offline. Will sync when online.');
      }

      setSnackbarVisible(true);
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch {
      Alert.alert('Error', 'Failed to save nutrition. Please try again.');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
            Log Nutrition
          </Text>

          {/* Date Picker */}
          <Card variant="outlined" style={{ marginBottom: spacing.md }}>
            <CardContent>
              <FormDatePicker control={control} name="date" label="Date" maximumDate={new Date()} />
            </CardContent>
          </Card>

          {/* Calories */}
          <Card variant="elevated">
            <CardContent>
              <Controller
                control={control}
                name="calories"
                render={({ field: { value } }) => (
                  <CalorieInput
                    value={value}
                    onChange={handleCaloriesChange}
                    target={calorieTarget}
                    disabled={autoCalcCalories}
                  />
                )}
              />
              {errors.calories && (
                <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                  {errors.calories.message}
                </Text>
              )}
            </CardContent>
          </Card>

          {/* Macros */}
          <Card variant="outlined" style={{ marginTop: spacing.md }}>
            <CardContent>
              <MacroInput
                values={{ protein, carbs, fat }}
                onChange={handleMacrosChange}
                targets={{
                  protein: proteinTarget,
                  carbs: carbsTarget,
                  fat: fatTarget,
                }}
                autoCalcCalories={autoCalcCalories}
                onAutoCalcChange={handleAutoCalcChange}
                onCaloriesChange={(cal) => setValue('calories', cal)}
              />
            </CardContent>
          </Card>

          {/* Fiber */}
          <Card variant="outlined" style={{ marginTop: spacing.md }}>
            <CardContent>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.onSurface, marginBottom: spacing.sm }}
              >
                Fiber (Optional)
              </Text>
              <Controller
                control={control}
                name="fiber_g"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    mode="outlined"
                    label="Fiber (g)"
                    value={value?.toString() ?? ''}
                    onChangeText={(text) => {
                      const num = parseFloat(text);
                      onChange(isNaN(num) ? undefined : num);
                    }}
                    keyboardType="numeric"
                    right={<TextInput.Affix text="g" />}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card variant="outlined" style={{ marginTop: spacing.md }}>
            <CardContent>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.onSurface, marginBottom: spacing.sm }}
              >
                Notes (Optional)
              </Text>
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    mode="outlined"
                    placeholder="What did you eat today?"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={2}
                  />
                )}
              />
            </CardContent>
          </Card>
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting || logNutrition.isPending}
            disabled={isSubmitting || logNutrition.isPending}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            Save Nutrition
          </Button>
        </View>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.lg,
  },
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  saveButton: {
    borderRadius: 12,
  },
  saveButtonContent: {
    paddingVertical: spacing.sm,
  },
});
