import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useAppTheme } from '@/theme';
import { queryClient, setupOnlineManager } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { RootNavigator } from '@/navigation';
import { ErrorBoundary } from '@/components/ui';

const AppContent: React.FC = () => {
  const { theme, isDark } = useAppTheme();
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    // Hydrate auth state from storage
    hydrate();

    // Setup online status listener for offline support
    const unsubscribe = setupOnlineManager();
    return () => {
      unsubscribe();
    };
  }, [hydrate]);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </PaperProvider>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <ThemeProvider>
              <AppContent />
            </ThemeProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
