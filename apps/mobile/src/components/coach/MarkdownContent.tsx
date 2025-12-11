import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import Markdown from 'react-native-marked';
import type { MarkedStyles } from 'react-native-marked';
import { typography, spacing } from '@/theme';

interface MarkdownContentProps {
  content: string | null | undefined;
  textColor: string;
  isStreaming?: boolean;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  textColor,
  isStreaming = false,
}) => {
  const theme = useTheme();

  const markdownStyles: MarkedStyles = useMemo(
    () => ({
      // Base text - matches bodyMedium typography exactly
      text: {
        color: textColor,
        fontSize: typography.bodyMedium.fontSize,
        lineHeight: typography.bodyMedium.lineHeight,
        letterSpacing: typography.bodyMedium.letterSpacing,
        fontWeight: typography.bodyMedium.fontWeight,
      },
      // Paragraph - minimal spacing to match plain text appearance
      paragraph: {
        marginBottom: 0,
        marginTop: 0,
        paddingBottom: 0,
        paddingTop: 0,
      },
      // Bold text
      strong: {
        fontWeight: '700',
      },
      // Italic text
      em: {
        fontStyle: 'italic',
      },
      // Strikethrough
      strikethrough: {
        textDecorationLine: 'line-through',
      },
      // Headers - scaled from MD3 typography
      h1: {
        fontSize: typography.titleLarge.fontSize,
        lineHeight: typography.titleLarge.lineHeight,
        fontWeight: '600',
        marginBottom: spacing.sm,
        color: textColor,
      },
      h2: {
        fontSize: typography.titleMedium.fontSize,
        lineHeight: typography.titleMedium.lineHeight,
        fontWeight: '600',
        marginBottom: spacing.sm,
        color: textColor,
      },
      h3: {
        fontSize: typography.titleSmall.fontSize,
        lineHeight: typography.titleSmall.lineHeight,
        fontWeight: '600',
        marginBottom: spacing.xs,
        color: textColor,
      },
      h4: {
        fontSize: typography.bodyLarge.fontSize,
        lineHeight: typography.bodyLarge.lineHeight,
        fontWeight: '600',
        marginBottom: spacing.xs,
        color: textColor,
      },
      h5: {
        fontSize: typography.bodyMedium.fontSize,
        lineHeight: typography.bodyMedium.lineHeight,
        fontWeight: '600',
        marginBottom: spacing.xs,
        color: textColor,
      },
      h6: {
        fontSize: typography.bodySmall.fontSize,
        lineHeight: typography.bodySmall.lineHeight,
        fontWeight: '600',
        marginBottom: spacing.xs,
        color: textColor,
      },
      // Inline code
      codespan: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: spacing.xs,
        borderRadius: 4,
        fontFamily: 'monospace',
        fontSize: typography.bodySmall.fontSize,
        color: textColor,
      },
      // Code blocks
      code: {
        backgroundColor: theme.colors.surface,
        padding: spacing.sm,
        borderRadius: 8,
        marginVertical: spacing.xs,
      },
      // Lists
      list: {
        marginBottom: spacing.xs,
        marginTop: 0,
      },
      li: {
        color: textColor,
        fontSize: typography.bodyMedium.fontSize,
        lineHeight: typography.bodyMedium.lineHeight,
        letterSpacing: typography.bodyMedium.letterSpacing,
      },
      // Links
      link: {
        color: theme.colors.primary,
        textDecorationLine: 'underline',
      },
      // Blockquotes
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.outline,
        paddingLeft: spacing.sm,
        marginVertical: spacing.xs,
        opacity: 0.9,
      },
      // Horizontal rule
      hr: {
        backgroundColor: theme.colors.outline,
        height: 1,
        marginVertical: spacing.sm,
      },
      // Tables
      table: {
        marginVertical: spacing.xs,
      },
      tableRow: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
      },
      tableCell: {
        padding: spacing.xs,
      },
    }),
    [textColor, theme.colors]
  );

  // Handle empty/streaming state
  if (!content && isStreaming) {
    return <Text style={{ color: textColor }}>...</Text>;
  }

  if (!content) {
    return null;
  }

  return (
    <Markdown
      value={content}
      styles={markdownStyles}
      flatListProps={{
        scrollEnabled: false,
        style: { backgroundColor: 'transparent' },
        contentContainerStyle: { backgroundColor: 'transparent' },
      }}
      theme={{
        colors: {
          text: textColor,
          link: theme.colors.primary,
          code: textColor,
          border: theme.colors.outline,
        },
      }}
    />
  );
};
