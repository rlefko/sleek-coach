import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, SegmentedButtons, Menu, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { useAppTheme, spacing } from '@/theme';
import { useUser, useUpdateProfile } from '@/services/hooks/useUser';
import {
  sexEnum,
  activityLevelEnum,
  activityLevelLabels,
  type Sex,
  type ActivityLevel,
} from '@/schemas/onboardingSchemas';
import type { SettingsScreenProps } from '@/navigation/types';

type Props = SettingsScreenProps<'EditProfile'>;

const editProfileSchema = z.object({
  display_name: z.string().max(100).optional().nullable(),
  height_cm: z.number().min(50).max(300).optional().nullable(),
  birth_year: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() - 13)
    .optional()
    .nullable(),
  sex: sexEnum.optional().nullable(),
  activity_level: activityLevelEnum.optional().nullable(),
});

type EditProfileData = z.infer<typeof editProfileSchema>;

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const { data: user, isLoading: isLoadingUser } = useUser();
  const updateProfile = useUpdateProfile();
  const [activityMenuVisible, setActivityMenuVisible] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { isValid, errors, isDirty },
  } = useForm<EditProfileData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      display_name: user?.profile?.display_name ?? '',
      height_cm: user?.profile?.height_cm ?? undefined,
      birth_year: user?.profile?.birth_year ?? undefined,
      sex: (user?.profile?.sex as Sex) ?? undefined,
      activity_level: (user?.profile?.activity_level as ActivityLevel) ?? undefined,
    },
    mode: 'onChange',
  });

  const onSubmit = async (formData: EditProfileData) => {
    try {
      await updateProfile.mutateAsync({
        display_name: formData.display_name || undefined,
        height_cm: formData.height_cm || undefined,
        birth_year: formData.birth_year || undefined,
        sex: formData.sex || undefined,
        activity_level: formData.activity_level || undefined,
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

  const currentYear = new Date().getFullYear();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Edit Profile
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Update your personal information
          </Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Controller
              control={control}
              name="display_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Display Name"
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.display_name?.message}
                  placeholder="Enter your name"
                />
              )}
            />

            <Controller
              control={control}
              name="height_cm"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Height (cm)"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  error={errors.height_cm?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="birth_year"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Birth Year"
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseInt(text, 10) : undefined)}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  error={errors.birth_year?.message}
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
                name="activity_level"
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
            {updateProfile.error && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                Failed to update profile. Please try again.
              </Text>
            )}
            <View style={styles.buttonRow}>
              <Button variant="text" onPress={() => navigation.goBack()}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleSubmit(onSubmit)}
                disabled={!isValid || !isDirty || updateProfile.isPending}
                loading={updateProfile.isPending}
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
