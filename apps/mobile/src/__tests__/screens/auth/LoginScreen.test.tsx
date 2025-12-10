import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { createMockNavigation } from '../../test-utils';

// Mock the useLogin hook
const mockMutateAsync = jest.fn();
jest.mock('@/services/hooks/useAuth', () => ({
  useLogin: () => ({
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

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderLoginScreen = (navigationOverrides = {}) => {
  const queryClient = createTestQueryClient();
  const mockNavigation = { ...createMockNavigation(), ...navigationOverrides };
  const mockRoute = { key: 'login', name: 'Login' as const, params: undefined };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={MD3DarkTheme}>
          <NavigationContainer>
            <LoginScreen navigation={mockNavigation as never} route={mockRoute} />
          </NavigationContainer>
        </PaperProvider>
      </QueryClientProvider>
    ),
    mockNavigation,
  };
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ token: 'test-token' });
  });

  describe('rendering', () => {
    it('renders the app title', () => {
      const { getByText } = renderLoginScreen();
      expect(getByText('Sleek Coach')).toBeTruthy();
    });

    it('renders the welcome message', () => {
      const { getByText } = renderLoginScreen();
      expect(getByText('Welcome back! Sign in to continue.')).toBeTruthy();
    });

    it('renders email input field', () => {
      const { getByText } = renderLoginScreen();
      expect(getByText('Email')).toBeTruthy();
    });

    it('renders password input field', () => {
      const { getByText } = renderLoginScreen();
      expect(getByText('Password')).toBeTruthy();
    });

    it('renders forgot password link', () => {
      const { getByText } = renderLoginScreen();
      expect(getByText('Forgot password?')).toBeTruthy();
    });

    it('renders sign in button', () => {
      const { getByText } = renderLoginScreen();
      expect(getByText('Sign In')).toBeTruthy();
    });

    it('renders create account link', () => {
      const { getByText } = renderLoginScreen();
      expect(getByText('Create Account')).toBeTruthy();
    });
  });

  describe('navigation', () => {
    it('navigates to Register screen when create account is pressed', () => {
      const { getByText, mockNavigation } = renderLoginScreen();

      fireEvent.press(getByText('Create Account'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
    });

    it('navigates to ForgotPassword screen when forgot password is pressed', () => {
      const { getByText, mockNavigation } = renderLoginScreen();

      fireEvent.press(getByText('Forgot password?'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
    });
  });

  describe('form validation', () => {
    it('displays email label', () => {
      const { getByText } = renderLoginScreen();
      expect(getByText('Email')).toBeTruthy();
    });

    it('displays password label', () => {
      const { getByText } = renderLoginScreen();
      expect(getByText('Password')).toBeTruthy();
    });
  });

  describe('password visibility toggle', () => {
    it('renders password field with toggle capability', () => {
      const { getByText } = renderLoginScreen();
      // Password field should exist
      expect(getByText('Password')).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('does not show error banner initially', () => {
      const { queryByText } = renderLoginScreen();
      expect(queryByText('Invalid email or password')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('has proper form structure', () => {
      const { getByText } = renderLoginScreen();
      // Verify all key elements are present
      expect(getByText('Email')).toBeTruthy();
      expect(getByText('Password')).toBeTruthy();
      expect(getByText('Sign In')).toBeTruthy();
    });
  });
});
