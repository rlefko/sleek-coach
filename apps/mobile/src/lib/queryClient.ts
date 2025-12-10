import { QueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        if (
          typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          typeof (error as { status: number }).status === 'number'
        ) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Online status manager for offline support
export const setupOnlineManager = () => {
  return NetInfo.addEventListener((state) => {
    const isOnline = !!state.isConnected;
    if (isOnline) {
      // Resume queries when back online
      queryClient.resumePausedMutations().then(() => {
        queryClient.invalidateQueries();
      });
    }
  });
};

// Helper to check if we're online
export const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return !!state.isConnected;
};
