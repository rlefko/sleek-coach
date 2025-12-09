import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { useAppTheme, spacing } from '@/theme';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
  showLabel?: boolean;
}

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({
  currentStep,
  totalSteps,
  showLabel = true,
}) => {
  const { theme } = useAppTheme();
  const progress = (currentStep + 1) / totalSteps;

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text
          variant="labelMedium"
          style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
        >
          Step {currentStep + 1} of {totalSteps}
        </Text>
      )}
      <ProgressBar
        progress={progress}
        color={theme.colors.primary}
        style={[styles.progressBar, { backgroundColor: theme.colors.surfaceVariant }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
});
