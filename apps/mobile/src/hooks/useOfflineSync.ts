import { useEffect, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useSyncStore } from '@/stores/syncStore';
import { checkinService, nutritionService } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

const SYNC_DEBOUNCE_MS = 2000;

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    pendingCheckins,
    pendingNutrition,
    isSyncing,
    setSyncing,
    removePendingCheckin,
    removePendingNutrition,
    incrementCheckinAttempts,
    incrementNutritionAttempts,
    setLastSyncAt,
    addSyncError,
  } = useSyncStore();

  const syncPendingData = useCallback(async () => {
    const hasPending = pendingCheckins.length > 0 || pendingNutrition.length > 0;

    if (!hasPending || isSyncing) {
      return;
    }

    // Check network status
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      return;
    }

    setSyncing(true);

    try {
      // Sync check-ins
      for (const pending of pendingCheckins) {
        try {
          await checkinService.create(pending.data);
          removePendingCheckin(pending.localId);
        } catch (error) {
          console.warn('Failed to sync check-in:', pending.localId, error);
          incrementCheckinAttempts(pending.localId);
          addSyncError(`Check-in sync failed: ${pending.data.date}`);
        }
      }

      // Sync nutrition
      for (const pending of pendingNutrition) {
        try {
          await nutritionService.createOrUpdate(pending.data);
          removePendingNutrition(pending.localId);
        } catch (error) {
          console.warn('Failed to sync nutrition:', pending.localId, error);
          incrementNutritionAttempts(pending.localId);
          addSyncError(`Nutrition sync failed: ${pending.data.date}`);
        }
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: queryKeys.checkins.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.all });

      setLastSyncAt(Date.now());
    } finally {
      setSyncing(false);
    }
  }, [
    pendingCheckins,
    pendingNutrition,
    isSyncing,
    setSyncing,
    removePendingCheckin,
    removePendingNutrition,
    incrementCheckinAttempts,
    incrementNutritionAttempts,
    setLastSyncAt,
    addSyncError,
    queryClient,
  ]);

  const debouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      syncPendingData();
    }, SYNC_DEBOUNCE_MS);
  }, [syncPendingData]);

  // Listen for network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        debouncedSync();
      }
    });

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [debouncedSync]);

  // Listen for app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        debouncedSync();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [debouncedSync]);

  // Initial sync on mount
  useEffect(() => {
    debouncedSync();
  }, [debouncedSync]);

  return {
    syncNow: syncPendingData,
    isSyncing,
    pendingCount: pendingCheckins.length + pendingNutrition.length,
  };
}
