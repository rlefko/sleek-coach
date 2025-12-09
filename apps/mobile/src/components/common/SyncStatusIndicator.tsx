import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, ActivityIndicator, IconButton } from 'react-native-paper';
import { spacing } from '@/theme';
import { useSyncStore } from '@/stores/syncStore';

interface SyncStatusIndicatorProps {
  compact?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ compact = false }) => {
  const theme = useTheme();
  const { pendingCheckins, pendingNutrition, isSyncing, syncErrors } = useSyncStore();

  const pendingCount = pendingCheckins.length + pendingNutrition.length;
  const hasErrors = syncErrors.length > 0;

  if (pendingCount === 0 && !isSyncing && !hasErrors) {
    return null;
  }

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {isSyncing ? (
          <ActivityIndicator size={16} color={theme.colors.primary} />
        ) : hasErrors ? (
          <IconButton
            icon="alert-circle"
            size={16}
            iconColor={theme.colors.error}
            style={styles.compactIcon}
          />
        ) : pendingCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: theme.colors.tertiary }]}>
            <Text variant="labelSmall" style={{ color: theme.colors.onTertiary, fontSize: 10 }}>
              {pendingCount}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: hasErrors ? theme.colors.errorContainer : theme.colors.tertiaryContainer,
        },
      ]}
    >
      {isSyncing ? (
        <>
          <ActivityIndicator size={16} color={theme.colors.onTertiaryContainer} />
          <Text variant="labelSmall" style={{ color: theme.colors.onTertiaryContainer }}>
            Syncing...
          </Text>
        </>
      ) : hasErrors ? (
        <>
          <IconButton
            icon="alert-circle"
            size={16}
            iconColor={theme.colors.onErrorContainer}
            style={styles.icon}
          />
          <Text variant="labelSmall" style={{ color: theme.colors.onErrorContainer }}>
            Sync failed
          </Text>
        </>
      ) : (
        <>
          <IconButton
            icon="cloud-upload"
            size={16}
            iconColor={theme.colors.onTertiaryContainer}
            style={styles.icon}
          />
          <Text variant="labelSmall" style={{ color: theme.colors.onTertiaryContainer }}>
            {pendingCount} pending
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },
  compactContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    margin: 0,
    padding: 0,
  },
  compactIcon: {
    margin: 0,
    padding: 0,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
