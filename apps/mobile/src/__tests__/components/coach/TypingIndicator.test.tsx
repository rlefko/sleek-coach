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
});
