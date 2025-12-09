import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { useAppTheme, spacing } from '@/theme';
import type { AuthScreenProps } from '@/navigation/types';

type Props = AuthScreenProps<'Register'>;

export const RegisterScreen: React.FC<Props> = () => {
  const navigation = useNavigation();
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          Create Account
        </Text>
        <Text
          variant="bodyLarge"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Register Screen - Phase 6
        </Text>
        <View style={styles.buttons}>
          <Button variant="secondary" fullWidth onPress={() => navigation.goBack()}>
            Back to Login
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
});
