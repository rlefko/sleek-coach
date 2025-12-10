import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface AllProvidersProps {
  children: ReactNode;
}

const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={MD3DarkTheme}>
        <NavigationContainer>{children}</NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllProviders, ...options });

// Re-export commonly used testing utilities (excluding render to avoid duplicate)
export {
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
  within,
  RenderOptions,
} from '@testing-library/react-native';

// Export customRender as render
export { customRender as render };

// Export providers for custom use cases
export { AllProviders, createTestQueryClient };

// Helper to create mock navigation prop
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
  getParent: jest.fn(),
  getState: jest.fn(() => ({
    routes: [],
    index: 0,
    key: 'test',
    type: 'stack',
    stale: false,
    routeNames: [],
  })),
  dispatch: jest.fn(),
  setParams: jest.fn(),
  getId: jest.fn(),
});

// Helper to create mock route prop
export const createMockRoute = <T extends Record<string, unknown>>(
  params?: T
): { key: string; name: string; params?: T } => ({
  key: 'test-route-key',
  name: 'TestScreen',
  params,
});
