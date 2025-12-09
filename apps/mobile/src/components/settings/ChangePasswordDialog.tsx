import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Dialog, Text, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { useAppTheme, spacing } from '@/theme';
import { useChangePassword } from '@/services/hooks/useUser';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/\d/, 'Must contain a digit')
      .regex(/[!@#$%^&*(),.?":{}|<>\-_=+[\]\\;'/`~]/, 'Must contain a special character'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export const ChangePasswordDialog: React.FC<Props> = ({ visible, onDismiss }) => {
  const { theme } = useAppTheme();
  const changePassword = useChangePassword();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid, errors },
  } = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
    mode: 'onChange',
  });

  const handleDismiss = () => {
    reset();
    changePassword.reset();
    onDismiss();
  };

  const onSubmit = async (data: ChangePasswordData) => {
    try {
      await changePassword.mutateAsync({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      handleDismiss();
    } catch {
      // Error is handled by mutation
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss}>
        <Dialog.Title>Change Password</Dialog.Title>
        <Dialog.Content>
          <Controller
            control={control}
            name="current_password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Current Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={errors.current_password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="new_password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="New Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={errors.new_password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirm_password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm New Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={errors.confirm_password?.message}
              />
            )}
          />

          <View style={styles.requirements}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Password requirements:
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {'\u2022'} At least 8 characters
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {'\u2022'} One uppercase and one lowercase letter
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {'\u2022'} One digit and one special character
            </Text>
          </View>

          {changePassword.error && (
            <HelperText type="error" visible style={styles.errorText}>
              {changePassword.error instanceof Error
                ? changePassword.error.message
                : 'Current password is incorrect'}
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
            disabled={!isValid || changePassword.isPending}
            loading={changePassword.isPending}
          >
            Change Password
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  requirements: {
    marginTop: spacing.md,
  },
  errorText: {
    marginTop: spacing.sm,
  },
});
