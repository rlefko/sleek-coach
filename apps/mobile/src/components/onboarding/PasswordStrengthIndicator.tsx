import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme, spacing } from '@/theme';
import { checkPasswordRequirements } from '@/schemas/authSchemas';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface RequirementItemProps {
  label: string;
  met: boolean;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ label, met }) => {
  const { theme } = useAppTheme();

  return (
    <View style={styles.requirementItem}>
      <MaterialCommunityIcons
        name={met ? 'check-circle' : 'circle-outline'}
        size={16}
        color={met ? theme.colors.primary : theme.colors.outline}
      />
      <Text
        variant="bodySmall"
        style={[
          styles.requirementText,
          { color: met ? theme.colors.onSurface : theme.colors.outline },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
}) => {
  const requirements = useMemo(() => checkPasswordRequirements(password), [password]);

  const metCount = Object.values(requirements).filter(Boolean).length;
  const totalCount = Object.keys(requirements).length;

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={styles.title}>
        Password requirements ({metCount}/{totalCount})
      </Text>
      <View style={styles.requirementsList}>
        <RequirementItem label="At least 8 characters" met={requirements.minLength} />
        <RequirementItem label="One uppercase letter" met={requirements.hasUppercase} />
        <RequirementItem label="One lowercase letter" met={requirements.hasLowercase} />
        <RequirementItem label="One number" met={requirements.hasDigit} />
        <RequirementItem label="One special character" met={requirements.hasSpecial} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.xs,
  },
  requirementsList: {
    gap: spacing.xs,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  requirementText: {
    flex: 1,
  },
});
