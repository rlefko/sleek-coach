import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { TypingIndicator } from '@/components/coach/TypingIndicator';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<PaperProvider theme={MD3DarkTheme}>{ui}</PaperProvider>);
};

describe('TypingIndicator', () => {
  describe('rendering', () => {
    it('renders three dots when visible', () => {
      const { getAllByTestId } = renderWithProvider(<TypingIndicator visible={true} />);

      expect(getAllByTestId('typing-dot')).toHaveLength(3);
    });

    it('renders three dots by default (visible=true is default)', () => {
      const { getAllByTestId } = renderWithProvider(<TypingIndicator />);

      expect(getAllByTestId('typing-dot')).toHaveLength(3);
    });

    it('returns null when not visible', () => {
      const { queryByTestId } = renderWithProvider(<TypingIndicator visible={false} />);

      expect(queryByTestId('typing-indicator')).toBeNull();
    });

    it('renders container with correct testID when visible', () => {
      const { getByTestId } = renderWithProvider(<TypingIndicator visible={true} />);

      expect(getByTestId('typing-indicator')).toBeTruthy();
    });
  });

  describe('styling', () => {
    it('uses theme colors for container background', () => {
      const { getByTestId } = renderWithProvider(<TypingIndicator visible={true} />);

      const container = getByTestId('typing-indicator');
      const style = container.props.style;
      const flattenedStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;

      expect(flattenedStyle.backgroundColor).toBe(MD3DarkTheme.colors.surfaceVariant);
    });
  });

  describe('animation lifecycle', () => {
    it('handles visibility toggle without error', () => {
      const { queryByTestId, rerender } = renderWithProvider(<TypingIndicator visible={true} />);

      // Initially visible with three dots
      expect(queryByTestId('typing-indicator')).toBeTruthy();

      // Toggle to hidden
      rerender(
        <PaperProvider theme={MD3DarkTheme}>
          <TypingIndicator visible={false} />
        </PaperProvider>
      );
      expect(queryByTestId('typing-indicator')).toBeNull();

      // Toggle back to visible - animation should restart cleanly
      rerender(
        <PaperProvider theme={MD3DarkTheme}>
          <TypingIndicator visible={true} />
        </PaperProvider>
      );
      expect(queryByTestId('typing-indicator')).toBeTruthy();
    });

    it('cleans up animation on unmount', () => {
      const { unmount, getByTestId } = renderWithProvider(<TypingIndicator visible={true} />);

      expect(getByTestId('typing-indicator')).toBeTruthy();

      // Should unmount without error (cleanup function runs)
      expect(() => unmount()).not.toThrow();
    });
  });
});
