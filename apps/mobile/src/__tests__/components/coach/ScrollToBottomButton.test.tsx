import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { ScrollToBottomButton } from '@/components/coach/ScrollToBottomButton';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<PaperProvider theme={MD3DarkTheme}>{ui}</PaperProvider>);
};

describe('ScrollToBottomButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('renders when visible is true', () => {
      const { getByTestId } = renderWithProvider(
        <ScrollToBottomButton visible={true} onPress={mockOnPress} />
      );

      expect(getByTestId('scroll-to-bottom-button')).toBeTruthy();
    });

    it('returns null when visible is false', () => {
      const { queryByTestId } = renderWithProvider(
        <ScrollToBottomButton visible={false} onPress={mockOnPress} />
      );

      expect(queryByTestId('scroll-to-bottom-button')).toBeNull();
    });
  });

  describe('interaction', () => {
    it('calls onPress when pressed', () => {
      const { getByTestId } = renderWithProvider(
        <ScrollToBottomButton visible={true} onPress={mockOnPress} />
      );

      const button = getByTestId('scroll-to-bottom-button');
      fireEvent.press(button);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has accessibility label', () => {
      const { getByLabelText } = renderWithProvider(
        <ScrollToBottomButton visible={true} onPress={mockOnPress} />
      );

      expect(getByLabelText('Scroll to bottom')).toBeTruthy();
    });

    it('has button accessibility role', () => {
      const { getByRole } = renderWithProvider(
        <ScrollToBottomButton visible={true} onPress={mockOnPress} />
      );

      expect(getByRole('button')).toBeTruthy();
    });
  });
});
