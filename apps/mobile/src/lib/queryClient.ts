import { QueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

// Query key factories for type-safe invalidation
export const queryKeys = {
  user: ['user'] as const,
  userProfile: ['user', 'profile'] as const,
  checkins: ['checkins'] as const,
  nutrition: ['nutrition'] as const,
  coach: ['coach'] as const,
  coachInsights: ['coach', 'insights'] as const,
  photos: ['photos'] as const,
} as const;

// Stale time configurations by query type
const staleTimes = {
  user: 1000 * 60 * 30, // 30 minutes - user profile rarely changes
  checkins: 1000 * 60 * 5, // 5 minutes - default for check-in data
  nutrition: 1000 * 60 * 5, // 5 minutes - nutrition data
  coach: 1000 * 60 * 10, // 10 minutes - coach insights/plans
  photos: 1000 * 60 * 15, // 15 minutes - photos rarely change
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: staleTimes.checkins, // Default: 5 minutes
      gcTime: 1000 * 60 * 60 * 4, // 4 hours (reduced from 24 for mobile memory)
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

// Selective query invalidation - only invalidate stale data-fetching queries
const invalidateStaleQueries = async () => {
  // Invalidate data queries that may have changed while offline
  // Use selective invalidation instead of broad invalidation
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.checkins,
      refetchType: 'active', // Only refetch if currently rendered
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.nutrition,
      refetchType: 'active',
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.coachInsights,
      refetchType: 'active',
    }),
  ]);
};

// Online status manager for offline support
export const setupOnlineManager = () => {
  return NetInfo.addEventListener((state) => {
    const isOnline = !!state.isConnected;
    if (isOnline) {
      // Resume paused mutations first, then selectively invalidate
      queryClient.resumePausedMutations().then(() => {
        invalidateStaleQueries();
      });
    }
  });
};

// Helper to check if we're online
export const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return !!state.isConnected;
};

// Get configured stale time for a query type
export const getStaleTime = (type: keyof typeof staleTimes): number => {
  return staleTimes[type];
};
