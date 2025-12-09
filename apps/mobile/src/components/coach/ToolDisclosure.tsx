import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Linking } from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { spacing } from '@/theme';
import type { ToolTrace } from '@/services/api/types';

interface ToolDisclosureProps {
  traces: ToolTrace[];
  initialExpanded?: boolean;
}

const ToolItem: React.FC<{ trace: ToolTrace }> = ({ trace }) => {
  const theme = useTheme();

  return (
    <View style={styles.toolItem}>
      <View style={styles.toolHeader}>
        <Icon
          name="tools"
          size={14}
          color={theme.colors.onSurfaceVariant}
          style={styles.toolIcon}
        />
        <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
          {trace.tool_name.replace(/_/g, ' ')}
        </Text>
        {trace.cached && (
          <View style={[styles.cacheBadge, { backgroundColor: theme.colors.tertiaryContainer }]}>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onTertiaryContainer, fontSize: 10 }}
            >
              cached
            </Text>
          </View>
        )}
        <Text variant="labelSmall" style={[styles.latency, { color: theme.colors.outline }]}>
          {trace.latency_ms}ms
        </Text>
      </View>

      <Text
        variant="bodySmall"
        style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
      >
        {trace.tool_description}
      </Text>

      {trace.output_summary && (
        <Text
          variant="bodySmall"
          style={[styles.output, { color: theme.colors.onSurface }]}
          numberOfLines={2}
        >
          {trace.output_summary}
        </Text>
      )}

      {trace.source_citations && trace.source_citations.length > 0 && (
        <View style={styles.citations}>
          {trace.source_citations.map((citation, idx) => (
            <Pressable
              key={idx}
              onPress={() => {
                if (citation.startsWith('http')) {
                  Linking.openURL(citation);
                }
              }}
            >
              <Text variant="labelSmall" style={{ color: theme.colors.primary }} numberOfLines={1}>
                {citation}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

export const ToolDisclosure: React.FC<ToolDisclosureProps> = ({
  traces,
  initialExpanded = false,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(initialExpanded);

  if (!traces || traces.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.header}>
        <Icon
          name={expanded ? 'chevron-down' : 'chevron-right'}
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
        <Icon name="cog" size={14} color={theme.colors.onSurfaceVariant} style={styles.cogIcon} />
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Used {traces.length} tool{traces.length !== 1 ? 's' : ''}
        </Text>
      </Pressable>

      {expanded && (
        <View style={styles.content}>
          <Divider style={styles.divider} />
          {traces.map((trace, index) => (
            <React.Fragment key={`${trace.tool_name}-${index}`}>
              <ToolItem trace={trace} />
              {index < traces.length - 1 && <Divider style={styles.itemDivider} />}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  cogIcon: {
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  divider: {
    marginBottom: spacing.sm,
  },
  itemDivider: {
    marginVertical: spacing.sm,
  },
  toolItem: {
    gap: spacing.xs,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  toolIcon: {
    marginRight: spacing.xs,
  },
  cacheBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  latency: {
    marginLeft: 'auto',
  },
  description: {
    marginLeft: spacing.lg,
  },
  output: {
    marginLeft: spacing.lg,
    fontStyle: 'italic',
  },
  citations: {
    marginLeft: spacing.lg,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
});
