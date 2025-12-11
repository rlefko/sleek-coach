import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { WeightInput } from '@/components/checkin/WeightInput';

// Wrap component with PaperProvider for testing
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<PaperProvider theme={MD3DarkTheme}>{ui}</PaperProvider>);
};

describe('WeightInput', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('displays formatted weight value', () => {
      const { getByDisplayValue } = renderWithProvider(
        <WeightInput value={75.5} onChange={mockOnChange} unit="kg" />
      );

      expect(getByDisplayValue('75.5')).toBeTruthy();
    });

    it('displays placeholder when value is undefined', () => {
      const { getByPlaceholderText } = renderWithProvider(
        <WeightInput value={undefined} onChange={mockOnChange} unit="kg" />
      );

      expect(getByPlaceholderText('--.-')).toBeTruthy();
    });

    it('renders with kg unit without error', () => {
      // Unit is displayed via TextInput.Affix which may not be directly queryable
      // Just verify the component renders without error
      const { getByDisplayValue } = renderWithProvider(
        <WeightInput value={75} onChange={mockOnChange} unit="kg" />
      );

      expect(getByDisplayValue('75.0')).toBeTruthy();
    });

    it('displays Weight title', () => {
      const { getByText } = renderWithProvider(
        <WeightInput value={75} onChange={mockOnChange} unit="kg" />
      );

      expect(getByText('Weight')).toBeTruthy();
    });
  });

  describe('text input', () => {
    it('calls onChange when text is entered', () => {
      const { getByDisplayValue } = renderWithProvider(
        <WeightInput value={75} onChange={mockOnChange} unit="kg" />
      );

      const input = getByDisplayValue('75.0');
      fireEvent.changeText(input, '76.5');

      expect(mockOnChange).toHaveBeenCalledWith(76.5);
    });

    it('calls onChange with undefined when text is cleared', () => {
      const { getByDisplayValue } = renderWithProvider(
        <WeightInput value={75} onChange={mockOnChange} unit="kg" />
      );

      const input = getByDisplayValue('75.0');
      fireEvent.changeText(input, '');

      expect(mockOnChange).toHaveBeenCalledWith(undefined);
    });

    it('respects minimum weight of 20 kg', () => {
      const { getByDisplayValue } = renderWithProvider(
        <WeightInput value={25} onChange={mockOnChange} unit="kg" />
      );

      const input = getByDisplayValue('25.0');
      fireEvent.changeText(input, '15');

      // Should not call onChange for values below minimum
      expect(mockOnChange).not.toHaveBeenCalledWith(15);
    });

    it('respects maximum weight of 500 kg', () => {
      const { getByDisplayValue } = renderWithProvider(
        <WeightInput value={490} onChange={mockOnChange} unit="kg" />
      );

      const input = getByDisplayValue('490.0');
      fireEvent.changeText(input, '550');

      // Should not call onChange for values above maximum
      expect(mockOnChange).not.toHaveBeenCalledWith(550);
    });
  });

  describe('unit conversion', () => {
    it('converts to lbs when unit is lbs', () => {
      // 75 kg = ~165.3 lbs
      const { getByDisplayValue } = renderWithProvider(
        <WeightInput value={75} onChange={mockOnChange} unit="lbs" />
      );

      // 75 * 2.20462 = 165.3465
      expect(getByDisplayValue('165.3')).toBeTruthy();
    });

    it('renders with lbs unit without error', () => {
      // Unit is displayed via TextInput.Affix which may not be directly queryable
      // Just verify the component renders without error
      const { getByDisplayValue } = renderWithProvider(
        <WeightInput value={75} onChange={mockOnChange} unit="lbs" />
      );

      // Value should be converted to lbs (75 * 2.20462 = 165.3)
      expect(getByDisplayValue('165.3')).toBeTruthy();
    });

    it('converts lbs input to kg for storage', () => {
      const { getByDisplayValue } = renderWithProvider(
        <WeightInput value={75} onChange={mockOnChange} unit="lbs" />
      );

      const input = getByDisplayValue('165.3');
      fireEvent.changeText(input, '220');

      // 220 lbs / 2.20462 = ~99.79 kg
      expect(mockOnChange).toHaveBeenCalled();
      const calledValue = mockOnChange.mock.calls[0][0];
      expect(calledValue).toBeCloseTo(99.79, 0);
    });
  });

  describe('last weight display', () => {
    it('displays last weight reference', () => {
      const { getByText } = renderWithProvider(
        <WeightInput value={76} onChange={mockOnChange} unit="kg" lastWeight={75} />
      );

      expect(getByText(/Last: 75.0 kg/)).toBeTruthy();
    });

    it('converts last weight to lbs when unit is lbs', () => {
      const { getByText } = renderWithProvider(
        <WeightInput value={76} onChange={mockOnChange} unit="lbs" lastWeight={75} />
      );

      // 75 * 2.20462 = 165.3465 -> 165.3
      expect(getByText(/Last: 165.3 lbs/)).toBeTruthy();
    });

    it('does not show last weight when not provided', () => {
      const { queryByText } = renderWithProvider(
        <WeightInput value={76} onChange={mockOnChange} unit="kg" />
      );

      expect(queryByText(/Last:/)).toBeNull();
    });

    it('uses last weight as placeholder when value is undefined', () => {
      const { getByPlaceholderText } = renderWithProvider(
        <WeightInput value={undefined} onChange={mockOnChange} unit="kg" lastWeight={72} />
      );

      expect(getByPlaceholderText('72.0')).toBeTruthy();
    });
  });

  describe('disabled state', () => {
    it('renders in disabled state', () => {
      // Component should render without error when disabled
      const { getByDisplayValue } = renderWithProvider(
        <WeightInput value={75} onChange={mockOnChange} unit="kg" disabled={true} />
      );

      expect(getByDisplayValue('75.0')).toBeTruthy();
    });

    it('does not call onChange when disabled', () => {
      const { getByDisplayValue } = renderWithProvider(
        <WeightInput value={75} onChange={mockOnChange} unit="kg" disabled={true} />
      );

      const input = getByDisplayValue('75.0');
      fireEvent.changeText(input, '80');

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('default value behavior', () => {
    it('shows last weight in helper text when value is undefined', () => {
      const { getByText, getByPlaceholderText } = renderWithProvider(
        <WeightInput value={undefined} onChange={mockOnChange} unit="kg" lastWeight={72} />
      );

      // Should display placeholder
      expect(getByPlaceholderText('72.0')).toBeTruthy();
      // Last weight should be shown in helper text
      expect(getByText(/Last: 72.0 kg/)).toBeTruthy();
    });
  });
});
