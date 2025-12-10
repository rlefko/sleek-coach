import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { createMockNavigation } from '../../test-utils';

// Mock the useRegister hook
const mockMutateAsync = jest.fn();
jest.mock('@/services/hooks/useAuth', () => ({
  useRegister: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// Mock useAppTheme
jest.mock('@/theme', () => ({
  useAppTheme: () => ({
    theme: {
      colors: {
        background: '#ffffff',
        onSurfaceVariant: '#666666',
        errorContainer: '#ffeeee',
        onErrorContainer: '#cc0000',
        primary: '#6200ee',
        onSurface: '#000000',
        error: '#cc0000',
      },
    },
  }),
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
}));

// Mock PasswordStrengthIndicator component
jest.mock('@/components/onboarding', () => ({
  PasswordStrengthIndicator: ({ password }: { password: string }) => {
    const React = require('react');
    const { Text } = require('react-native');
    if (!password) return null;
    return React.createElement(
      Text,
      { testID: 'password-strength' },
      'Password strength indicator'
    );
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderRegisterScreen = (navigationOverrides = {}) => {
  const queryClient = createTestQueryClient();
  const mockNavigation = { ...createMockNavigation(), ...navigationOverrides };
  const mockRoute = { key: 'register', name: 'Register' as const, params: undefined };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={MD3DarkTheme}>
          <NavigationContainer>
            <RegisterScreen navigation={mockNavigation as never} route={mockRoute} />
          </NavigationContainer>
        </PaperProvider>
      </QueryClientProvider>
    ),
    mockNavigation,
  };
};

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ token: 'test-token' });
  });

  describe('rendering', () => {
    it('renders the create account title', () => {
      const { getAllByText } = renderRegisterScreen();
      // Title and button both say "Create Account"
      expect(getAllByText('Create Account').length).toBeGreaterThan(0);
    });

    it('renders the subtitle message', () => {
      const { getByText } = renderRegisterScreen();
      expect(getByText('Start your fitness journey today.')).toBeTruthy();
    });

    it('renders email input field', () => {
      const { getByText } = renderRegisterScreen();
      expect(getByText('Email')).toBeTruthy();
    });

    it('renders password input field', () => {
      const { getByText } = renderRegisterScreen();
      expect(getByText('Password')).toBeTruthy();
    });

    it('renders confirm password input field', () => {
      const { getByText } = renderRegisterScreen();
      expect(getByText('Confirm Password')).toBeTruthy();
    });

    it('renders terms checkbox', () => {
      const { getByText } = renderRegisterScreen();
      expect(getByText(/Terms of Service/)).toBeTruthy();
    });

    it('renders sign in link', () => {
      const { getByText } = renderRegisterScreen();
      expect(getByText('Sign In')).toBeTruthy();
    });
  });

  describe('navigation', () => {
    it('navigates to Login screen when sign in is pressed', () => {
      const { getByText, mockNavigation } = renderRegisterScreen();

      fireEvent.press(getByText('Sign In'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('form fields', () => {
    it('displays all required form labels', () => {
      const { getByText } = renderRegisterScreen();
      expect(getByText('Email')).toBeTruthy();
      expect(getByText('Password')).toBeTruthy();
      expect(getByText('Confirm Password')).toBeTruthy();
    });
  });

  describe('password fields', () => {
    it('renders both password fields', () => {
      const { getByText } = renderRegisterScreen();
      // Should have Password and Confirm Password fields
      expect(getByText('Password')).toBeTruthy();
      expect(getByText('Confirm Password')).toBeTruthy();
    });
  });

  describe('terms checkbox', () => {
    it('renders the terms checkbox', () => {
      const { getByTestId } = renderRegisterScreen();
      expect(getByTestId('checkbox')).toBeTruthy();
    });

    it('can toggle checkbox', () => {
      const { getByTestId, getByText } = renderRegisterScreen();

      // Checkbox should be unchecked initially (☐)
      expect(getByText('☐')).toBeTruthy();

      // Press the checkbox
      fireEvent.press(getByTestId('checkbox'));

      // Now it should be checked (☑)
      expect(getByText('☑')).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('does not show error banner initially', () => {
      const { queryByText } = renderRegisterScreen();
      expect(queryByText(/already exists/)).toBeNull();
    });
  });

  describe('already have account section', () => {
    it('displays already have account text', () => {
      const { getByText } = renderRegisterScreen();
      expect(getByText('Already have an account?')).toBeTruthy();
    });
  });
});
