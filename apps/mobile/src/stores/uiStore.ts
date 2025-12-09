import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

type ThemeMode = 'light' | 'dark' | 'system';
type UnitSystem = 'metric' | 'imperial';

interface UIState {
  themeMode: ThemeMode;
  unitSystem: UnitSystem;
  isGlobalLoading: boolean;
  lastSyncTimestamp: number | null;
  hasCompletedOnboarding: boolean;
}

interface UIActions {
  setThemeMode: (mode: ThemeMode) => void;
  setUnitSystem: (system: UnitSystem) => void;
  setGlobalLoading: (loading: boolean) => void;
  setLastSyncTimestamp: (timestamp: number) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      themeMode: 'system',
      unitSystem: 'metric',
      isGlobalLoading: false,
      lastSyncTimestamp: null,
      hasCompletedOnboarding: false,

      setThemeMode: (mode) => set({ themeMode: mode }),
      setUnitSystem: (system) => set({ unitSystem: system }),
      setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
      setLastSyncTimestamp: (timestamp) => set({ lastSyncTimestamp: timestamp }),
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        unitSystem: state.unitSystem,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);
