import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Switch, Surface, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { OnboardingProgressBar } from '@/components/onboarding';
import { useAppTheme, spacing } from '@/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { PhotoVisibility } from '@/schemas/onboardingSchemas';
import type { OnboardingScreenProps } from '@/navigation/types';

type Props = OnboardingScreenProps<'PrivacySettings'>;

export const PrivacySettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const { currentStep, totalSteps, data, updateData, nextStep } = useOnboardingStore();

  const handleContinue = () => {
    nextStep();
    navigation.navigate('OnboardingComplete');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />

        <Text variant="headlineMedium" style={styles.title}>
          Privacy settings
        </Text>
        <Text
          variant="bodyLarge"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Control how your data is used. You can change these anytime.
        </Text>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <View style={styles.settingHeader}>
                  <MaterialCommunityIcons
                    name="web"
                    size={24}
                    color={theme.colors.primary}
                    style={styles.settingIcon}
                  />
                  <Text variant="titleMedium">Web Search</Text>
                </View>
                <Text
                  variant="bodySmall"
                  style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}
                >
                  Allow AI coach to search the web for recipes and fitness information.
                </Text>
              </View>
              <Switch
                value={data.allowWebSearch ?? true}
                onValueChange={(value) => updateData({ allowWebSearch: value })}
                color={theme.colors.primary}
              />
            </View>
          </Surface>

          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <View style={styles.settingHeader}>
                  <MaterialCommunityIcons
                    name="chart-line"
                    size={24}
                    color={theme.colors.primary}
                    style={styles.settingIcon}
                  />
                  <Text variant="titleMedium">Anonymous Analytics</Text>
                </View>
                <Text
                  variant="bodySmall"
                  style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}
                >
                  Help improve the app by sharing anonymous usage data.
                </Text>
              </View>
              <Switch
                value={data.allowDataSharing ?? false}
                onValueChange={(value) => updateData({ allowDataSharing: value })}
                color={theme.colors.primary}
              />
            </View>
          </Surface>

          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <View style={styles.photoSettingContent}>
              <View style={styles.settingHeader}>
                <MaterialCommunityIcons
                  name="image-lock"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.settingIcon}
                />
                <Text variant="titleMedium">Progress Photos</Text>
              </View>
              <Text
                variant="bodySmall"
                style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}
              >
                Choose who can access your progress photos.
              </Text>

              <RadioButton.Group
                value={data.photoVisibility || 'private'}
                onValueChange={(value) => updateData({ photoVisibility: value as PhotoVisibility })}
              >
                <View style={styles.radioOption}>
                  <RadioButton.Android value="private" color={theme.colors.primary} />
                  <View style={styles.radioContent}>
                    <Text variant="bodyMedium">Private</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Only you can see your photos
                    </Text>
                  </View>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton.Android value="coach_only" color={theme.colors.primary} />
                  <View style={styles.radioContent}>
                    <Text variant="bodyMedium">AI Coach Access</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      AI coach can analyze your photos for progress tracking
                    </Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>
          </Surface>

          <View style={styles.privacyNote}>
            <MaterialCommunityIcons name="shield-check" size={20} color={theme.colors.primary} />
            <Text
              variant="bodySmall"
              style={[styles.privacyNoteText, { color: theme.colors.onSurfaceVariant }]}
            >
              Your data is encrypted and stored securely. We never sell your personal information.
            </Text>
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
  card: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  settingIcon: {
    marginRight: spacing.sm,
  },
  settingDescription: {
    marginLeft: 32,
  },
  photoSettingContent: {
    flex: 1,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },
  radioContent: {
    flex: 1,
    paddingTop: 4,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    padding: spacing.md,
  },
  privacyNoteText: {
    flex: 1,
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
