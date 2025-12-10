import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, IconButton, Banner, Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui';
import { FormInput } from '@/components/forms';
import { PasswordStrengthIndicator } from '@/components/onboarding';
import { useAppTheme, spacing } from '@/theme';
import { useRegister } from '@/services/hooks/useAuth';
import { useLegalVersions } from '@/services/hooks/useLegal';
import { registerSchema, RegisterFormData } from '@/schemas/authSchemas';
import type { AuthScreenProps } from '@/navigation/types';

type Props = AuthScreenProps<'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const registerMutation = useRegister();
  const { data: legalVersions } = useLegalVersions();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isValid },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false as unknown as true,
    },
    mode: 'onChange',
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    try {
      await registerMutation.mutateAsync({
        email: data.email,
        password: data.password,
        accepted_terms_version: legalVersions?.terms_of_service_version || '1.0',
        accepted_privacy_version: legalVersions?.privacy_policy_version || '1.0',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('409')) {
          setErrorMessage('An account with this email already exists.');
        } else if (error.message.includes('Network')) {
          setErrorMessage('Unable to connect. Please check your internet connection.');
        } else {
          setErrorMessage('An error occurred. Please try again.');
        }
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text variant="headlineLarge" style={styles.title}>
              Create Account
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
            >
              Start your fitness journey today.
            </Text>
          </View>

          {errorMessage && (
            <Banner
              visible
              icon="alert-circle"
              style={[styles.errorBanner, { backgroundColor: theme.colors.errorContainer }]}
            >
              <Text style={{ color: theme.colors.onErrorContainer }}>{errorMessage}</Text>
            </Banner>
          )}

          <View style={styles.form}>
            <FormInput
              control={control}
              name="email"
              label="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />

            <FormInput
              control={control}
              name="password"
              label="Password"
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              autoComplete="new-password"
              right={
                <IconButton
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                  size={20}
                />
              }
            />

            <PasswordStrengthIndicator password={password || ''} />

            <FormInput
              control={control}
              name="confirmPassword"
              label="Confirm Password"
              secureTextEntry={!showConfirmPassword}
              textContentType="newPassword"
              autoComplete="new-password"
              right={
                <IconButton
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  size={20}
                />
              }
            />

            <Controller
              control={control}
              name="acceptTerms"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View style={styles.checkboxContainer}>
                  <Checkbox.Android
                    status={value ? 'checked' : 'unchecked'}
                    onPress={() => onChange(!value)}
                    color={theme.colors.primary}
                  />
                  <Text
                    variant="bodyMedium"
                    style={[styles.checkboxLabel, { color: theme.colors.onSurface }]}
                  >
                    I accept the{' '}
                    <Text
                      style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}
                      onPress={() => navigation.navigate('TermsOfService')}
                    >
                      Terms of Service
                    </Text>{' '}
                    and{' '}
                    <Text
                      style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}
                      onPress={() => navigation.navigate('PrivacyPolicy')}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                  {error && (
                    <Text
                      variant="bodySmall"
                      style={[styles.checkboxError, { color: theme.colors.error }]}
                    >
                      {error.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Button
              variant="primary"
              fullWidth
              onPress={handleSubmit(onSubmit)}
              loading={registerMutation.isPending}
              disabled={!isValid || registerMutation.isPending}
              style={styles.registerButton}
            >
              Create Account
            </Button>
          </View>

          <View style={styles.footer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Already have an account?
            </Text>
            <Button variant="text" onPress={() => navigation.navigate('Login')}>
              Sign In
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
  },
  errorBanner: {
    marginBottom: spacing.md,
    borderRadius: 8,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  checkboxLabel: {
    flex: 1,
    paddingTop: 8,
  },
  checkboxError: {
    width: '100%',
    marginTop: spacing.xs,
    marginLeft: 40,
  },
  registerButton: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});
