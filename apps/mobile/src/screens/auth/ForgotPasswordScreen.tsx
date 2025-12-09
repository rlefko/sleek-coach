import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, Banner } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { FormInput } from '@/components/forms';
import { useAppTheme, spacing } from '@/theme';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/schemas/authSchemas';
import type { AuthScreenProps } from '@/navigation/types';

type Props = AuthScreenProps<'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { isValid },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onChange',
  });

  const onSubmit = async (_data: ForgotPasswordFormData) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // Simulate API call - backend endpoint for password reset would be wired here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSubmitted(true);
    } catch {
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.successContent}>
          <View style={[styles.successIcon, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="email-check" size={48} color={theme.colors.primary} />
          </View>
          <Text variant="headlineSmall" style={styles.successTitle}>
            Check your email
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.successSubtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            We've sent password reset instructions to:
          </Text>
          <Text variant="titleMedium" style={[styles.email, { color: theme.colors.primary }]}>
            {getValues('email')}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.helpText, { color: theme.colors.onSurfaceVariant }]}
          >
            If you don't see the email, check your spam folder.
          </Text>
          <Button
            variant="primary"
            fullWidth
            onPress={() => navigation.navigate('Login')}
            style={styles.backButton}
          >
            Back to Sign In
          </Button>
        </View>
      </SafeAreaView>
    );
  }

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
              Reset Password
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
            >
              Enter your email address and we'll send you instructions to reset your password.
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

            <Button
              variant="primary"
              fullWidth
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={!isValid || isSubmitting}
              style={styles.submitButton}
            >
              Send Reset Link
            </Button>
          </View>

          <View style={styles.footer}>
            <Button variant="text" onPress={() => navigation.navigate('Login')}>
              Back to Sign In
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
    marginBottom: spacing.sm,
    textAlign: 'center',
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
  submitButton: {
    marginTop: spacing.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  successSubtitle: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  email: {
    marginBottom: spacing.lg,
  },
  helpText: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: '100%',
    maxWidth: 300,
  },
});
