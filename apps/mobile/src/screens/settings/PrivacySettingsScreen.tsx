import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Switch, Surface, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme, spacing } from '@/theme';
import { useConsents, useGrantConsent, useRevokeConsent } from '@/services/hooks';
import type { ConsentType } from '@/services/api/types';
import type { SettingsScreenProps } from '@/navigation/types';

type Props = SettingsScreenProps<'PrivacySettings'>;

interface ConsentToggleProps {
  title: string;
  description: string;
  consentType: ConsentType;
  isEnabled: boolean;
  isLoading: boolean;
  onToggle: (consentType: ConsentType, enabled: boolean) => void;
}

const ConsentToggle: React.FC<ConsentToggleProps> = ({
  title,
  description,
  consentType,
  isEnabled,
  isLoading,
  onToggle,
}) => {
  const { theme } = useAppTheme();

  return (
    <Surface style={[styles.toggleCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.toggleContent}>
        <View style={styles.toggleText}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            {title}
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
          >
            {description}
          </Text>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Switch value={isEnabled} onValueChange={(value) => onToggle(consentType, value)} />
        )}
      </View>
    </Surface>
  );
};

export const PrivacySettingsScreen: React.FC<Props> = () => {
  const { theme } = useAppTheme();
  const { data: consentsData, isLoading: isLoadingConsents } = useConsents();
  const grantConsent = useGrantConsent();
  const revokeConsent = useRevokeConsent();

  const getConsentStatus = useCallback(
    (consentType: ConsentType): boolean => {
      const consent = consentsData?.consents.find((c) => c.consent_type === consentType);
      return consent?.granted && !consent?.revoked_at ? true : false;
    },
    [consentsData]
  );

  const handleToggle = useCallback(
    async (consentType: ConsentType, enabled: boolean) => {
      if (enabled) {
        await grantConsent.mutateAsync({ consent_type: consentType, granted: true });
      } else {
        await revokeConsent.mutateAsync(consentType);
      }
    },
    [grantConsent, revokeConsent]
  );

  const isUpdating = grantConsent.isPending || revokeConsent.isPending;

  if (isLoadingConsents) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['bottom']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            variant="bodyMedium"
            style={[styles.loadingText, { color: theme.colors.onSurface }]}
          >
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text
          variant="bodyMedium"
          style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}
        >
          Control how your data is used. Changes take effect immediately.
        </Text>

        <ConsentToggle
          title="AI Web Search"
          description="Allow the AI coach to search the web for fitness tips, recipes, and exercise information to provide more helpful responses."
          consentType="web_search"
          isEnabled={getConsentStatus('web_search')}
          isLoading={isUpdating}
          onToggle={handleToggle}
        />

        <ConsentToggle
          title="Anonymous Analytics"
          description="Help us improve the app by sharing anonymous usage data. No personal information is included."
          consentType="analytics"
          isEnabled={getConsentStatus('analytics')}
          isLoading={isUpdating}
          onToggle={handleToggle}
        />

        <ConsentToggle
          title="Photo AI Analysis"
          description="Allow the AI coach to access your progress photos to provide visual progress insights and feedback."
          consentType="photo_ai_access"
          isEnabled={getConsentStatus('photo_ai_access')}
          isLoading={isUpdating}
          onToggle={handleToggle}
        />

        <Surface
          style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]}
          elevation={0}
        >
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Your data is encrypted and stored securely. We never sell your personal information. You
            can request a copy of your data or delete your account at any time from the Account
            section.
          </Text>
        </Surface>
      </ScrollView>
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
  loadingText: {
    marginTop: spacing.md,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionDescription: {
    marginBottom: spacing.lg,
  },
  toggleCard: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleText: {
    flex: 1,
    marginRight: spacing.md,
  },
  description: {
    marginTop: spacing.xs,
  },
  infoCard: {
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
});
