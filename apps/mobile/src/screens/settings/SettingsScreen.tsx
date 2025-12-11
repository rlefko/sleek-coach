import React from 'react';
import { StyleSheet, ScrollView, Alert, Share, Platform } from 'react-native';
import { Text, List, Divider, Switch, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Paths, File as ExpoFile } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Card } from '@/components/ui';
import { ChangePasswordDialog, DeleteAccountDialog } from '@/components/settings';
import { useAppTheme, spacing } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useUser, useExportData } from '@/services/hooks/useUser';
import { authService } from '@/services/api';
import type { SettingsScreenProps } from '@/navigation/types';

type Props = SettingsScreenProps<'Settings'>;

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, themeMode, setThemeMode, isDark } = useAppTheme();
  const unitSystem = useUIStore((s) => s.unitSystem);
  const setUnitSystem = useUIStore((s) => s.setUnitSystem);
  const { data: user } = useUser();
  const exportData = useExportData();
  const { refreshToken, logout } = useAuthStore();

  const [showChangePassword, setShowChangePassword] = React.useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState<string | null>(null);

  const handleExportData = async () => {
    try {
      const data = await exportData.mutateAsync();
      const jsonString = JSON.stringify(data, null, 2);
      const fileName = `sleek-coach-export-${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        // Web: trigger download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Mobile: save and share
        const file = new ExpoFile(Paths.document, fileName);
        await file.write(jsonString);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'application/json',
            dialogTitle: 'Export Your Data',
          });
        } else {
          await Share.share({
            message: jsonString,
            title: 'Sleek Coach Data Export',
          });
        }
      }

      setSnackbarMessage('Data exported successfully');
    } catch {
      setSnackbarMessage('Failed to export data');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            if (refreshToken) {
              await authService.logout(refreshToken);
            }
          } finally {
            logout();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          Settings
        </Text>
        {user && (
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            {user.email}
          </Text>
        )}

        <Card variant="elevated">
          <List.Section>
            <List.Subheader>Profile</List.Subheader>
            <List.Item
              title="Edit Profile"
              description="Update your personal information"
              left={(props) => <List.Icon {...props} icon="account-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('EditProfile')}
            />
            <Divider />
            <List.Item
              title="Goals"
              description="Update your fitness goals"
              left={(props) => <List.Icon {...props} icon="target" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('EditGoals')}
            />
            <Divider />
            <List.Item
              title="Diet Preferences"
              description="Update dietary preferences"
              left={(props) => <List.Icon {...props} icon="food-apple-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('EditPreferences')}
            />
          </List.Section>
        </Card>

        <Card variant="elevated">
          <List.Section>
            <List.Subheader>Appearance</List.Subheader>
            <List.Item
              title="Dark Mode"
              description={`Currently: ${themeMode}`}
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={isDark}
                  onValueChange={() => setThemeMode(isDark ? 'light' : 'dark')}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Measurement System"
              description={unitSystem === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lbs, in)'}
              left={(props) => <List.Icon {...props} icon="ruler" />}
              right={() => (
                <Switch
                  value={unitSystem === 'imperial'}
                  onValueChange={() =>
                    setUnitSystem(unitSystem === 'metric' ? 'imperial' : 'metric')
                  }
                />
              )}
            />
          </List.Section>
        </Card>

        <Card variant="elevated">
          <List.Section>
            <List.Subheader>Integrations</List.Subheader>
            <List.Item
              title="Import from MyFitnessPal"
              description="Import your nutrition history"
              left={(props) => <List.Icon {...props} icon="database-import-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('MFPImport')}
            />
          </List.Section>
        </Card>

        <Card variant="elevated">
          <List.Section>
            <List.Subheader>Security</List.Subheader>
            <List.Item
              title="Change Password"
              description="Update your password"
              left={(props) => <List.Icon {...props} icon="lock-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowChangePassword(true)}
            />
          </List.Section>
        </Card>

        <Card variant="elevated">
          <List.Section>
            <List.Subheader>Legal</List.Subheader>
            <List.Item
              title="Privacy Settings"
              description="Manage your data sharing preferences"
              left={(props) => <List.Icon {...props} icon="shield-account-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('PrivacySettings')}
            />
            <Divider />
            <List.Item
              title="Privacy Policy"
              description="How we handle your data"
              left={(props) => <List.Icon {...props} icon="file-document-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />
            <Divider />
            <List.Item
              title="Terms of Service"
              description="Terms and conditions"
              left={(props) => <List.Icon {...props} icon="file-sign" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('TermsOfService')}
            />
            <Divider />
            <List.Item
              title="Data Retention"
              description="How long we keep your data"
              left={(props) => <List.Icon {...props} icon="database-clock-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('DataRetention')}
            />
          </List.Section>
        </Card>

        <Card variant="elevated">
          <List.Section>
            <List.Subheader>Account</List.Subheader>
            <List.Item
              title="Export Data"
              description="Download all your data"
              left={(props) => <List.Icon {...props} icon="download-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleExportData}
              disabled={exportData.isPending}
            />
            <Divider />
            <List.Item
              title="Sign Out"
              titleStyle={{ color: theme.colors.error }}
              left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
              onPress={handleSignOut}
            />
            <Divider />
            <List.Item
              title="Delete Account"
              description="Permanently delete your account"
              titleStyle={{ color: theme.colors.error }}
              descriptionStyle={{ color: theme.colors.error }}
              left={(props) => (
                <List.Icon {...props} icon="delete-forever" color={theme.colors.error} />
              )}
              onPress={() => setShowDeleteAccount(true)}
            />
          </List.Section>
        </Card>
      </ScrollView>

      <ChangePasswordDialog
        visible={showChangePassword}
        onDismiss={() => setShowChangePassword(false)}
      />

      <DeleteAccountDialog
        visible={showDeleteAccount}
        onDismiss={() => setShowDeleteAccount(false)}
      />

      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage(null)}
        duration={3000}
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
  scrollContent: {
    padding: spacing.md,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
});
