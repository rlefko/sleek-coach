import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, ActivityIndicator, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme, spacing } from '@/theme';
import { usePrivacyPolicy, useTermsOfService, useDataRetention } from '@/services/hooks/useLegal';
import type { SettingsScreenProps } from '@/navigation/types';

type LegalDocumentType = 'PrivacyPolicy' | 'TermsOfService' | 'DataRetention';

interface LegalDocumentScreenProps {
  documentType: LegalDocumentType;
}

const useDocumentData = (documentType: LegalDocumentType) => {
  const privacyPolicy = usePrivacyPolicy();
  const termsOfService = useTermsOfService();
  const dataRetention = useDataRetention();

  switch (documentType) {
    case 'PrivacyPolicy':
      return privacyPolicy;
    case 'TermsOfService':
      return termsOfService;
    case 'DataRetention':
      return dataRetention;
    default:
      return privacyPolicy;
  }
};

const LegalDocumentContent: React.FC<LegalDocumentScreenProps> = ({ documentType }) => {
  const { theme } = useAppTheme();
  const { data, isLoading, error } = useDocumentData(documentType);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyMedium" style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          Loading document...
        </Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={{ color: theme.colors.error }}>
          Failed to load document
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.errorSubtext, { color: theme.colors.onSurfaceVariant }]}
        >
          Please check your internet connection and try again.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <Surface style={[styles.versionBadge, { backgroundColor: theme.colors.primaryContainer }]}>
        <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
          Version {data.version} - Effective {new Date(data.effective_date).toLocaleDateString()}
        </Text>
      </Surface>

      <Text
        variant="bodyMedium"
        style={[styles.content, { color: theme.colors.onSurface }]}
        selectable
      >
        {data.content}
      </Text>
    </ScrollView>
  );
};

export const PrivacyPolicyScreen: React.FC<SettingsScreenProps<'PrivacyPolicy'>> = () => {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <LegalDocumentContent documentType="PrivacyPolicy" />
    </SafeAreaView>
  );
};

export const TermsOfServiceScreen: React.FC<SettingsScreenProps<'TermsOfService'>> = () => {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <LegalDocumentContent documentType="TermsOfService" />
    </SafeAreaView>
  );
};

export const DataRetentionScreen: React.FC<SettingsScreenProps<'DataRetention'>> = () => {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <LegalDocumentContent documentType="DataRetention" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorSubtext: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  versionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  content: {
    lineHeight: 24,
  },
});
