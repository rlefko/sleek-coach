import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { CheckInScreen } from '@/screens/home/CheckInScreen';

// Mock the hooks
const mockCreateCheckinMutateAsync = jest.fn();
const mockUploadPhotoMutateAsync = jest.fn();
const mockAddPendingCheckin = jest.fn();

jest.mock('@/services/hooks', () => ({
  useLatestCheckin: () => ({
    data: { weight_kg: 75.5 },
  }),
  useCreateCheckin: () => ({
    mutateAsync: mockCreateCheckinMutateAsync,
    isPending: false,
  }),
  useUploadPhoto: () => ({
    mutateAsync: mockUploadPhotoMutateAsync,
    isPending: false,
  }),
}));

jest.mock('@/stores/uiStore', () => ({
  useUIStore: (selector: (s: { unitSystem: string }) => unknown) =>
    selector({ unitSystem: 'metric' }),
}));

jest.mock('@/stores/syncStore', () => ({
  useSyncStore: (selector: (s: { addPendingCheckin: typeof mockAddPendingCheckin }) => unknown) =>
    selector({ addPendingCheckin: mockAddPendingCheckin }),
}));

// Mock useAppTheme
jest.mock('@/theme', () => ({
  useAppTheme: () => ({
    theme: {
      colors: {
        background: '#ffffff',
        onSurfaceVariant: '#666666',
        onSurface: '#000000',
        error: '#cc0000',
        primary: '#6200ee',
      },
    },
  }),
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
}));

// Mock components
jest.mock('@/components/checkin', () => ({
  WeightInput: ({
    value,
    onChange,
    unit,
    lastWeight,
  }: {
    value?: number;
    onChange: (v: number) => void;
    unit: string;
    lastWeight?: number;
  }) => {
    const React = require('react');
    const { View, Text, TextInput } = require('react-native');
    return React.createElement(
      View,
      { testID: 'weight-input' },
      React.createElement(Text, null, 'Weight'),
      React.createElement(TextInput, {
        testID: 'weight-value',
        value: value?.toString() || '',
        onChangeText: (text: string) => onChange(parseFloat(text) || 0),
      }),
      React.createElement(Text, null, unit),
      lastWeight && React.createElement(Text, null, `Last: ${lastWeight}`)
    );
  },
  MetricSlider: ({
    type,
    value: _value,
    onChange: _onChange,
  }: {
    type: string;
    value?: number;
    onChange: (v: number) => void;
  }) => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(
      View,
      { testID: `metric-${type}` },
      React.createElement(Text, null, type)
    );
  },
  PhotoPicker: ({
    photos: _photos,
    onAdd: _onAdd,
    onRemove: _onRemove,
    maxPhotos: _maxPhotos,
  }: {
    photos: unknown[];
    onAdd: () => void;
    onRemove: (i: number) => void;
    maxPhotos: number;
  }) => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(
      View,
      { testID: 'photo-picker' },
      React.createElement(Text, null, 'Photo Picker')
    );
  },
}));

jest.mock('@/components/ui', () => ({
  Card: ({
    children,
    variant: _variant,
    style,
  }: {
    children: React.ReactNode;
    variant?: string;
    style?: object;
  }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { style }, children);
  },
  CardContent: ({ children }: { children: React.ReactNode }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, null, children);
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderCheckInScreen = () => {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={MD3DarkTheme}>
        <NavigationContainer>
          <CheckInScreen />
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
};

describe('CheckInScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateCheckinMutateAsync.mockResolvedValue({ id: 'checkin-1' });
    mockUploadPhotoMutateAsync.mockResolvedValue({ id: 'photo-1' });
  });

  describe('rendering', () => {
    it('renders the daily check-in title', () => {
      const { getByText } = renderCheckInScreen();
      expect(getByText('Daily Check-in')).toBeTruthy();
    });

    it('renders the current date', () => {
      const { getByText } = renderCheckInScreen();
      // Should show current day (e.g., "Monday, December 10")
      const today = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      expect(getByText(today)).toBeTruthy();
    });

    it('renders weight input', () => {
      const { getByTestId } = renderCheckInScreen();
      expect(getByTestId('weight-input')).toBeTruthy();
    });

    it('renders notes section label', () => {
      const { getByText } = renderCheckInScreen();
      expect(getByText('Notes (Optional)')).toBeTruthy();
    });

    it('renders wellness metrics toggle', () => {
      const { getByText } = renderCheckInScreen();
      expect(getByText(/wellness metrics/)).toBeTruthy();
    });

    it('renders photo picker', () => {
      const { getByTestId } = renderCheckInScreen();
      expect(getByTestId('photo-picker')).toBeTruthy();
    });

    it('renders save button', () => {
      const { getByText } = renderCheckInScreen();
      expect(getByText('Save Check-in')).toBeTruthy();
    });
  });

  describe('optional metrics', () => {
    it('hides optional metrics by default', () => {
      const { queryByTestId } = renderCheckInScreen();
      // Metrics should not be visible initially
      expect(queryByTestId('metric-energy')).toBeNull();
    });

    it('shows optional metrics when toggle is pressed', () => {
      const { getByText, getByTestId } = renderCheckInScreen();

      // Press the show metrics button
      fireEvent.press(getByText(/Show wellness metrics/));

      // Now metrics should be visible
      expect(getByTestId('metric-energy')).toBeTruthy();
      expect(getByTestId('metric-sleep')).toBeTruthy();
      expect(getByTestId('metric-mood')).toBeTruthy();
    });

    it('hides metrics when toggle is pressed again', () => {
      const { getByText, queryByTestId } = renderCheckInScreen();

      // Show metrics
      fireEvent.press(getByText(/Show wellness metrics/));
      expect(queryByTestId('metric-energy')).toBeTruthy();

      // Hide metrics
      fireEvent.press(getByText(/Hide wellness metrics/));
      expect(queryByTestId('metric-energy')).toBeNull();
    });
  });

  describe('notes input', () => {
    it('renders notes placeholder text', () => {
      const { getByPlaceholderText } = renderCheckInScreen();
      expect(getByPlaceholderText('How are you feeling today?')).toBeTruthy();
    });

    it('allows entering notes', () => {
      const { getByPlaceholderText, getByDisplayValue } = renderCheckInScreen();

      const notesInput = getByPlaceholderText('How are you feeling today?');
      fireEvent.changeText(notesInput, 'Feeling great today!');

      expect(getByDisplayValue('Feeling great today!')).toBeTruthy();
    });
  });

  describe('unit display', () => {
    it('displays kg when metric system is selected', () => {
      const { getByText } = renderCheckInScreen();
      expect(getByText('kg')).toBeTruthy();
    });
  });

  describe('last weight reference', () => {
    it('displays last weight value', () => {
      const { getByText } = renderCheckInScreen();
      expect(getByText(/Last: 75.5/)).toBeTruthy();
    });
  });

  describe('form structure', () => {
    it('has all main sections', () => {
      const { getByText, getByTestId } = renderCheckInScreen();

      // Title section
      expect(getByText('Daily Check-in')).toBeTruthy();

      // Weight section
      expect(getByTestId('weight-input')).toBeTruthy();

      // Notes section
      expect(getByText('Notes (Optional)')).toBeTruthy();

      // Photos section
      expect(getByTestId('photo-picker')).toBeTruthy();

      // Save button
      expect(getByText('Save Check-in')).toBeTruthy();
    });
  });
});
