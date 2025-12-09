import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { useAppTheme, spacing } from '@/theme';
import type { AuthScreenProps } from '@/navigation/types';

type Props = AuthScreenProps<'Login'>;

export const LoginScreen: React.FC<Props> = () => {
  const navigation = useNavigation();
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          Sleek Coach
        </Text>
        <Text
          variant="bodyLarge"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Login Screen - Phase 6
        </Text>
        <View style={styles.buttons}>
          <Button
            variant="primary"
            fullWidth
            onPress={() => navigation.navigate('Register' as never)}
          >
            Go to Register
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onPress={() => navigation.navigate('ForgotPassword' as never)}
            style={styles.secondButton}
          >
            Forgot Password
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    marginBottom: spacing.xl,
  },
  buttons: {
    width: '100%',
    maxWidth: 300,
  },
  secondButton: {
    marginTop: spacing.md,
  },
});
