import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, List, Divider, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui';
import { useAppTheme, spacing } from '@/theme';

export const SettingsScreen: React.FC = () => {
  const { theme, themeMode, setThemeMode, isDark } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          Settings
        </Text>
        <Text
          variant="bodyLarge"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Settings Screen - Phase 10
        </Text>

        <Card variant="elevated">
          <List.Section>
            <List.Subheader>Profile</List.Subheader>
            <List.Item
              title="Edit Profile"
              description="Update your personal information"
              left={(props) => <List.Icon {...props} icon="account-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
            <Divider />
            <List.Item
              title="Goals"
              description="Update your fitness goals"
              left={(props) => <List.Icon {...props} icon="target" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
            <Divider />
            <List.Item
              title="Diet Preferences"
              description="Update dietary preferences"
              left={(props) => <List.Icon {...props} icon="food-apple-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
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
            />
            <Divider />
            <List.Item
              title="Sign Out"
              titleStyle={{ color: theme.colors.error }}
              left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
            />
          </List.Section>
        </Card>
      </ScrollView>
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
