import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { spacing } from '@/theme';

type IconName = React.ComponentProps<typeof Icon>['name'];

interface FocusAreaListProps {
  focusAreas: string[];
  recommendations?: string[];
}

const getFocusAreaIcon = (area: string): IconName => {
  const lowercased = area.toLowerCase();
  if (lowercased.includes('protein')) return 'food-steak';
  if (lowercased.includes('hydrat')) return 'water';
  if (lowercased.includes('sleep')) return 'sleep';
  if (lowercased.includes('exercise') || lowercased.includes('workout')) return 'dumbbell';
  if (lowercased.includes('calor')) return 'fire';
  if (lowercased.includes('carb')) return 'bread-slice';
  if (lowercased.includes('fat')) return 'oil';
  if (lowercased.includes('fiber')) return 'leaf';
  if (lowercased.includes('stress')) return 'meditation';
  if (lowercased.includes('track')) return 'chart-line';
  return 'target';
};

export const FocusAreaList: React.FC<FocusAreaListProps> = ({ focusAreas, recommendations }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Focus Areas */}
      {focusAreas.length > 0 && (
        <View style={styles.section}>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            Focus Areas
          </Text>
          <View style={styles.focusAreas}>
            {focusAreas.map((area, index) => (
              <View
                key={index}
                style={[styles.focusAreaChip, { backgroundColor: theme.colors.primaryContainer }]}
              >
                <Icon
                  name={getFocusAreaIcon(area)}
                  size={16}
                  color={theme.colors.onPrimaryContainer}
                />
                <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                  {area}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <View style={styles.section}>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            Recommendations
          </Text>
          <View style={styles.recommendations}>
            {recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Icon
                  name="check-circle"
                  size={16}
                  color={theme.colors.primary}
                  style={styles.recIcon}
                />
                <Text
                  variant="bodyMedium"
                  style={[styles.recText, { color: theme.colors.onSurface }]}
                >
                  {rec}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  focusAreas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  focusAreaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  recommendations: {
    gap: spacing.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recIcon: {
    marginTop: 2,
    marginRight: spacing.sm,
  },
  recText: {
    flex: 1,
    lineHeight: 20,
  },
});
