import React from 'react';
import { StyleSheet } from 'react-native';
import { Portal, Dialog, Text, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { useAppTheme, spacing } from '@/theme';
import { useDeleteAccount } from '@/services/hooks/useUser';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'Type DELETE to confirm' }),
  }),
});

type DeleteAccountData = z.infer<typeof deleteAccountSchema>;

export const DeleteAccountDialog: React.FC<Props> = ({ visible, onDismiss }) => {
  const { theme } = useAppTheme();
  const deleteAccount = useDeleteAccount();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid, errors },
  } = useForm<DeleteAccountData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      confirmation: '' as 'DELETE',
    },
    mode: 'onChange',
  });

  const handleDismiss = () => {
    reset();
    deleteAccount.reset();
    onDismiss();
  };

  const onSubmit = async () => {
    try {
      await deleteAccount.mutateAsync();
      // Account deleted, user will be logged out automatically
    } catch {
      // Error is handled by mutation
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss}>
        <Dialog.Title style={{ color: theme.colors.error }}>Delete Account</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={[styles.warningText, { color: theme.colors.error }]}>
            This action is permanent and cannot be undone.
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            All your data will be permanently deleted, including:
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.listItem, { color: theme.colors.onSurfaceVariant }]}
          >
            {'\u2022'} Your profile and settings
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.listItem, { color: theme.colors.onSurfaceVariant }]}
          >
            {'\u2022'} All check-ins and weight history
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.listItem, { color: theme.colors.onSurfaceVariant }]}
          >
            {'\u2022'} Nutrition logs and meal data
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.listItem, { color: theme.colors.onSurfaceVariant }]}
          >
            {'\u2022'} Progress photos
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.listItem, { color: theme.colors.onSurfaceVariant }]}
          >
            {'\u2022'} Coach conversations and plans
          </Text>

          <Text
            variant="bodyMedium"
            style={[styles.confirmLabel, { color: theme.colors.onSurface }]}
          >
            Type <Text style={{ fontWeight: 'bold' }}>DELETE</Text> to confirm:
          </Text>

          <Controller
            control={control}
            name="confirmation"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirmation"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmation?.message}
                autoCapitalize="characters"
              />
            )}
          />

          {deleteAccount.error && (
            <HelperText type="error" visible style={styles.errorText}>
              {deleteAccount.error instanceof Error
                ? deleteAccount.error.message
                : 'Failed to delete account. Please try again.'}
            </HelperText>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="text" onPress={handleDismiss}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || deleteAccount.isPending}
            loading={deleteAccount.isPending}
            style={{ backgroundColor: theme.colors.error }}
          >
            Delete Account
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  warningText: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  listItem: {
    marginLeft: spacing.sm,
  },
  confirmLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorText: {
    marginTop: spacing.sm,
  },
});
