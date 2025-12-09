import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Menu, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { useAppTheme, spacing } from '@/theme';
import { useUser, useUpdatePreferences } from '@/services/hooks/useUser';
import { dietTypeEnum, dietTypeLabels, type DietType } from '@/schemas/onboardingSchemas';
import type { SettingsScreenProps } from '@/navigation/types';

type Props = SettingsScreenProps<'EditPreferences'>;

const editPreferencesSchema = z.object({
  diet_type: dietTypeEnum,
  allergies: z.array(z.string()).default([]),
  disliked_foods: z.array(z.string()).default([]),
  meals_per_day: z.number().min(1).max(10),
});

type EditPreferencesData = z.infer<typeof editPreferencesSchema>;

const COMMON_ALLERGIES = [
  'Dairy',
  'Eggs',
  'Peanuts',
  'Tree Nuts',
  'Wheat',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
  'Gluten',
];

export const EditPreferencesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const { data: user, isLoading: isLoadingUser } = useUser();
  const updatePreferences = useUpdatePreferences();
  const [dietMenuVisible, setDietMenuVisible] = React.useState(false);
  const [newAllergy, setNewAllergy] = React.useState('');
  const [newDislikedFood, setNewDislikedFood] = React.useState('');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isValid, isDirty },
  } = useForm<EditPreferencesData>({
    resolver: zodResolver(editPreferencesSchema),
    defaultValues: {
      diet_type: (user?.preferences?.diet_type as DietType) ?? 'none',
      allergies: user?.preferences?.allergies ?? [],
      disliked_foods: user?.preferences?.disliked_foods ?? [],
      meals_per_day: user?.preferences?.meals_per_day ?? 3,
    },
    mode: 'onChange',
  });

  const allergies = watch('allergies');
  const dislikedFoods = watch('disliked_foods');

  const addAllergy = (allergy: string) => {
    if (allergy && !allergies.includes(allergy)) {
      setValue('allergies', [...allergies, allergy], { shouldDirty: true });
    }
    setNewAllergy('');
  };

  const removeAllergy = (allergy: string) => {
    setValue(
      'allergies',
      allergies.filter((a) => a !== allergy),
      { shouldDirty: true }
    );
  };

  const addDislikedFood = (food: string) => {
    if (food && !dislikedFoods.includes(food)) {
      setValue('disliked_foods', [...dislikedFoods, food], { shouldDirty: true });
    }
    setNewDislikedFood('');
  };

  const removeDislikedFood = (food: string) => {
    setValue(
      'disliked_foods',
      dislikedFoods.filter((f) => f !== food),
      { shouldDirty: true }
    );
  };

  const onSubmit = async (formData: EditPreferencesData) => {
    try {
      await updatePreferences.mutateAsync({
        diet_type: formData.diet_type,
        allergies: formData.allergies,
        disliked_foods: formData.disliked_foods,
        meals_per_day: formData.meals_per_day,
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
            Diet Preferences
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Update your dietary preferences
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
                Diet Type
              </Text>
              <Controller
                control={control}
                name="diet_type"
                render={({ field: { onChange, value } }) => (
                  <Menu
                    visible={dietMenuVisible}
                    onDismiss={() => setDietMenuVisible(false)}
                    anchor={
                      <Button
                        variant="secondary"
                        fullWidth
                        onPress={() => setDietMenuVisible(true)}
                      >
                        {dietTypeLabels[value]}
                      </Button>
                    }
                    contentStyle={{ backgroundColor: theme.colors.surface }}
                  >
                    {(Object.keys(dietTypeLabels) as DietType[]).map((type) => (
                      <Menu.Item
                        key={type}
                        onPress={() => {
                          onChange(type);
                          setDietMenuVisible(false);
                        }}
                        title={dietTypeLabels[type]}
                        leadingIcon={value === type ? 'check' : undefined}
                      />
                    ))}
                  </Menu>
                )}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text
                variant="labelLarge"
                style={[styles.fieldLabel, { color: theme.colors.onSurface }]}
              >
                Allergies
              </Text>
              <View style={styles.chipContainer}>
                {allergies.map((allergy) => (
                  <Chip key={allergy} onClose={() => removeAllergy(allergy)} style={styles.chip}>
                    {allergy}
                  </Chip>
                ))}
              </View>
              <View style={styles.quickAddContainer}>
                {COMMON_ALLERGIES.filter((a) => !allergies.includes(a)).map((allergy) => (
                  <Chip
                    key={allergy}
                    onPress={() => addAllergy(allergy)}
                    style={styles.quickAddChip}
                    mode="outlined"
                  >
                    + {allergy}
                  </Chip>
                ))}
              </View>
              <View style={styles.inputRow}>
                <Input
                  label="Add custom allergy"
                  value={newAllergy}
                  onChangeText={setNewAllergy}
                  style={styles.flex}
                />
                <Button
                  variant="text"
                  onPress={() => addAllergy(newAllergy)}
                  disabled={!newAllergy}
                >
                  Add
                </Button>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text
                variant="labelLarge"
                style={[styles.fieldLabel, { color: theme.colors.onSurface }]}
              >
                Disliked Foods
              </Text>
              <View style={styles.chipContainer}>
                {dislikedFoods.map((food) => (
                  <Chip key={food} onClose={() => removeDislikedFood(food)} style={styles.chip}>
                    {food}
                  </Chip>
                ))}
              </View>
              <View style={styles.inputRow}>
                <Input
                  label="Add disliked food"
                  value={newDislikedFood}
                  onChangeText={setNewDislikedFood}
                  style={styles.flex}
                />
                <Button
                  variant="text"
                  onPress={() => addDislikedFood(newDislikedFood)}
                  disabled={!newDislikedFood}
                >
                  Add
                </Button>
              </View>
            </View>

            <Controller
              control={control}
              name="meals_per_day"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Meals Per Day"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseInt(text, 10) : undefined)}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                />
              )}
            />
          </ScrollView>

          <View style={styles.footer}>
            {updatePreferences.error && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                Failed to update preferences. Please try again.
              </Text>
            )}
            <View style={styles.buttonRow}>
              <Button variant="text" onPress={() => navigation.goBack()}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleSubmit(onSubmit)}
                disabled={!isValid || !isDirty || updatePreferences.isPending}
                loading={updatePreferences.isPending}
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  quickAddContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  quickAddChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
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
