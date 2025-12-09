import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';
import type { CheckInCreate, NutritionDayCreate } from '@/services/api/types';

export interface PendingCheckin {
  localId: string;
  data: CheckInCreate;
  createdAt: number;
  attempts: number;
}

export interface PendingNutrition {
  localId: string;
  data: NutritionDayCreate;
  createdAt: number;
  attempts: number;
}

interface SyncState {
  pendingCheckins: PendingCheckin[];
  pendingNutrition: PendingNutrition[];
  isSyncing: boolean;
  lastSyncAt: number | null;
  syncErrors: string[];
}

interface SyncActions {
  addPendingCheckin: (data: CheckInCreate) => string;
  removePendingCheckin: (localId: string) => void;
  incrementCheckinAttempts: (localId: string) => void;
  addPendingNutrition: (data: NutritionDayCreate) => string;
  removePendingNutrition: (localId: string) => void;
  incrementNutritionAttempts: (localId: string) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncAt: (timestamp: number) => void;
  addSyncError: (error: string) => void;
  clearSyncErrors: () => void;
  clearAllPending: () => void;
  getPendingCount: () => number;
}

function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const MAX_RETRY_ATTEMPTS = 3;

export const useSyncStore = create<SyncState & SyncActions>()(
  persist(
    (set, get) => ({
      // State
      pendingCheckins: [],
      pendingNutrition: [],
      isSyncing: false,
      lastSyncAt: null,
      syncErrors: [],

      // Actions
      addPendingCheckin: (data) => {
        const localId = generateLocalId();
        set((state) => ({
          pendingCheckins: [
            ...state.pendingCheckins,
            { localId, data, createdAt: Date.now(), attempts: 0 },
          ],
        }));
        return localId;
      },

      removePendingCheckin: (localId) => {
        set((state) => ({
          pendingCheckins: state.pendingCheckins.filter((c) => c.localId !== localId),
        }));
      },

      incrementCheckinAttempts: (localId) => {
        set((state) => ({
          pendingCheckins: state.pendingCheckins
            .map((c) => (c.localId === localId ? { ...c, attempts: c.attempts + 1 } : c))
            .filter((c) => c.attempts < MAX_RETRY_ATTEMPTS),
        }));
      },

      addPendingNutrition: (data) => {
        const localId = generateLocalId();
        set((state) => ({
          pendingNutrition: [
            ...state.pendingNutrition,
            { localId, data, createdAt: Date.now(), attempts: 0 },
          ],
        }));
        return localId;
      },

      removePendingNutrition: (localId) => {
        set((state) => ({
          pendingNutrition: state.pendingNutrition.filter((n) => n.localId !== localId),
        }));
      },

      incrementNutritionAttempts: (localId) => {
        set((state) => ({
          pendingNutrition: state.pendingNutrition
            .map((n) => (n.localId === localId ? { ...n, attempts: n.attempts + 1 } : n))
            .filter((n) => n.attempts < MAX_RETRY_ATTEMPTS),
        }));
      },

      setSyncing: (syncing) => {
        set({ isSyncing: syncing });
      },

      setLastSyncAt: (timestamp) => {
        set({ lastSyncAt: timestamp });
      },

      addSyncError: (error) => {
        set((state) => ({
          syncErrors: [...state.syncErrors.slice(-9), error], // Keep last 10 errors
        }));
      },

      clearSyncErrors: () => {
        set({ syncErrors: [] });
      },

      clearAllPending: () => {
        set({
          pendingCheckins: [],
          pendingNutrition: [],
          syncErrors: [],
        });
      },

      getPendingCount: () => {
        const state = get();
        return state.pendingCheckins.length + state.pendingNutrition.length;
      },
    }),
    {
      name: 'sync-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
