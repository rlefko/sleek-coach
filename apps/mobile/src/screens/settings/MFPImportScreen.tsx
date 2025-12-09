import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Checkbox, ActivityIndicator, Banner } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card } from '@/components/ui';
import { useAppTheme, spacing } from '@/theme';
import { integrationService } from '@/services/api/integrationService';
import { queryKeys } from '@/lib/queryKeys';
import type { MFPImportResponse } from '@/services/api/types';
import type { SettingsScreenProps } from '@/navigation/types';

type Props = SettingsScreenProps<'MFPImport'>;

export const MFPImportScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = React.useState<DocumentPicker.DocumentPickerAsset | null>(
    null
  );
  const [overwrite, setOverwrite] = React.useState(false);
  const [result, setResult] = React.useState<MFPImportResponse | null>(null);

  const importMutation = useMutation({
    mutationFn: (file: DocumentPicker.DocumentPickerAsset) =>
      integrationService.importMFP(file, overwrite),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.all });
    },
  });

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/zip',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
        setResult(null);
      }
    } catch {
      // User cancelled or error
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          Import from MyFitnessPal
        </Text>
        <Text
          variant="bodyLarge"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Import your nutrition history from MyFitnessPal
        </Text>

        <Card variant="elevated" style={styles.instructionsCard}>
          <Text
            variant="titleMedium"
            style={[styles.instructionsTitle, { color: theme.colors.onSurface }]}
          >
            How to export from MyFitnessPal
          </Text>
          <View style={styles.instructionsList}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              1. Log into MyFitnessPal on the web
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              2. Go to Settings {'->'} Privacy & Sharing
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              3. Click "Download Your Data"
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              4. Wait for the email with your data
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              5. Download the ZIP file and select it below
            </Text>
          </View>
        </Card>

        <View style={styles.uploadSection}>
          <Button
            variant="secondary"
            onPress={pickDocument}
            disabled={importMutation.isPending}
            fullWidth
          >
            {selectedFile ? 'Change File' : 'Select ZIP File'}
          </Button>

          {selectedFile && (
            <View style={styles.fileInfo}>
              <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
                Selected: {selectedFile.name}
              </Text>
            </View>
          )}

          <View style={styles.checkboxRow}>
            <Checkbox
              status={overwrite ? 'checked' : 'unchecked'}
              onPress={() => setOverwrite(!overwrite)}
              disabled={importMutation.isPending}
            />
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurface }}
              onPress={() => setOverwrite(!overwrite)}
            >
              Overwrite existing entries
            </Text>
          </View>
        </View>

        {importMutation.isPending && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text
              variant="bodyMedium"
              style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}
            >
              Importing data...
            </Text>
          </View>
        )}

        {importMutation.error && (
          <Banner
            visible
            actions={[]}
            icon="alert-circle"
            style={[styles.errorBanner, { backgroundColor: theme.colors.errorContainer }]}
          >
            <Text style={{ color: theme.colors.onErrorContainer }}>
              {importMutation.error instanceof Error
                ? importMutation.error.message
                : 'Import failed. Please try again.'}
            </Text>
          </Banner>
        )}

        {result && (
          <Card variant="elevated" style={styles.resultCard}>
            <Text
              variant="titleMedium"
              style={[styles.resultTitle, { color: theme.colors.primary }]}
            >
              Import Complete
            </Text>
            <View style={styles.resultStats}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
                  {result.imported}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Imported
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {result.skipped}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Skipped
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {result.total_rows}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Total
                </Text>
              </View>
            </View>
            {result.date_range_start && result.date_range_end && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Date range: {result.date_range_start} to {result.date_range_end}
              </Text>
            )}
            {result.errors.length > 0 && (
              <View style={styles.errorsContainer}>
                <Text
                  variant="labelMedium"
                  style={[styles.errorsTitle, { color: theme.colors.error }]}
                >
                  Errors ({result.errors.length}):
                </Text>
                {result.errors.slice(0, 5).map((error, index) => (
                  <Text
                    key={index}
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {error}
                  </Text>
                ))}
                {result.errors.length > 5 && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    ... and {result.errors.length - 5} more
                  </Text>
                )}
              </View>
            )}
          </Card>
        )}

        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            onPress={handleImport}
            disabled={!selectedFile || importMutation.isPending}
            loading={importMutation.isPending}
            fullWidth
          >
            Import
          </Button>
          <Button variant="text" onPress={() => navigation.goBack()} style={styles.cancelButton}>
            {result ? 'Done' : 'Cancel'}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  instructionsCard: {
    marginBottom: spacing.lg,
  },
  instructionsTitle: {
    marginBottom: spacing.sm,
  },
  instructionsList: {
    gap: spacing.xs,
  },
  uploadSection: {
    marginBottom: spacing.lg,
  },
  fileInfo: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.sm,
  },
  errorBanner: {
    marginBottom: spacing.md,
    borderRadius: 8,
  },
  resultCard: {
    marginBottom: spacing.lg,
  },
  resultTitle: {
    marginBottom: spacing.md,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  errorsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  errorsTitle: {
    marginBottom: spacing.xs,
  },
  buttonContainer: {
    gap: spacing.sm,
  },
  cancelButton: {
    marginTop: spacing.xs,
  },
});
