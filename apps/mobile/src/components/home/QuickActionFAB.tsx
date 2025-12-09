import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { FAB, Portal, useTheme } from 'react-native-paper';

interface QuickActionFABProps {
  onLogWeight: () => void;
  onLogMeal: () => void;
  onTalkToCoach: () => void;
}

export const QuickActionFAB: React.FC<QuickActionFABProps> = ({
  onLogWeight,
  onLogMeal,
  onTalkToCoach,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Portal>
      <FAB.Group
        open={open}
        visible
        icon={open ? 'close' : 'plus'}
        actions={[
          {
            icon: 'scale-bathroom',
            label: 'Log Weight',
            onPress: () => {
              setOpen(false);
              onLogWeight();
            },
          },
          {
            icon: 'food-apple',
            label: 'Log Meal',
            onPress: () => {
              setOpen(false);
              onLogMeal();
            },
          },
          {
            icon: 'robot',
            label: 'Talk to Coach',
            onPress: () => {
              setOpen(false);
              onTalkToCoach();
            },
          },
        ]}
        onStateChange={({ open }) => setOpen(open)}
        style={styles.fabGroup}
        fabStyle={{ backgroundColor: theme.colors.primary }}
        color={theme.colors.onPrimary}
      />
    </Portal>
  );
};

const styles = StyleSheet.create({
  fabGroup: {
    paddingBottom: 80, // Account for bottom tabs
  },
});
