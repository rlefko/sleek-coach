import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, IconButton, Banner } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui';
import { FormInput } from '@/components/forms';
import { useAppTheme, spacing } from '@/theme';
import { useLogin } from '@/services/hooks/useAuth';
import { loginSchema, LoginFormData } from '@/schemas/authSchemas';
import type { AuthScreenProps } from '@/navigation/types';

type Props = AuthScreenProps<'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useAppTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loginMutation = useLogin();

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          setErrorMessage('Invalid email or password. Please try again.');
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
              Sleek Coach
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
            >
              Welcome back! Sign in to continue.
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

            <View style={styles.passwordContainer}>
              <FormInput
                control={control}
                name="password"
                label="Password"
                secureTextEntry={!showPassword}
                textContentType="password"
                autoComplete="password"
                right={
                  <IconButton
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                    size={20}
                  />
                }
              />
            </View>

            <Button
              variant="text"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}
            >
              Forgot password?
            </Button>

            <Button
              variant="primary"
              fullWidth
              onPress={handleSubmit(onSubmit)}
              loading={loginMutation.isPending}
              disabled={!isValid || loginMutation.isPending}
              style={styles.loginButton}
            >
              Sign In
            </Button>
          </View>

          <View style={styles.footer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Don't have an account?
            </Text>
            <Button variant="text" onPress={() => navigation.navigate('Register')}>
              Create Account
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
  passwordContainer: {
    position: 'relative',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  loginButton: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});
