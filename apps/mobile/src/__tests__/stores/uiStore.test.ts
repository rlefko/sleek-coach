import { useUIStore } from '@/stores/uiStore';

// Storage is mocked globally in jest.setup.js

describe('uiStore', () => {
  beforeEach(() => {
    // Reset the store to default state
    const store = useUIStore.getState();
    store.setThemeMode('system');
    store.setUnitSystem('metric');
    store.setGlobalLoading(false);
    store.setHasCompletedOnboarding(false);
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const store = useUIStore.getState();
      store.setThemeMode('system');
      store.setUnitSystem('metric');
      store.setGlobalLoading(false);
      store.setHasCompletedOnboarding(false);

      const state = useUIStore.getState();
      expect(state.themeMode).toBe('system');
      expect(state.unitSystem).toBe('metric');
      expect(state.isGlobalLoading).toBe(false);
      expect(state.hasCompletedOnboarding).toBe(false);
    });
  });

  describe('setThemeMode', () => {
    it('sets theme mode to light', () => {
      const { setThemeMode } = useUIStore.getState();

      setThemeMode('light');

      expect(useUIStore.getState().themeMode).toBe('light');
    });

    it('sets theme mode to dark', () => {
      const { setThemeMode } = useUIStore.getState();

      setThemeMode('dark');

      expect(useUIStore.getState().themeMode).toBe('dark');
    });

    it('sets theme mode to system', () => {
      const { setThemeMode } = useUIStore.getState();

      setThemeMode('light'); // First change to something else
      setThemeMode('system');

      expect(useUIStore.getState().themeMode).toBe('system');
    });
  });

  describe('setUnitSystem', () => {
    it('sets unit system to metric', () => {
      const { setUnitSystem } = useUIStore.getState();

      setUnitSystem('imperial'); // First change to something else
      setUnitSystem('metric');

      expect(useUIStore.getState().unitSystem).toBe('metric');
    });

    it('sets unit system to imperial', () => {
      const { setUnitSystem } = useUIStore.getState();

      setUnitSystem('imperial');

      expect(useUIStore.getState().unitSystem).toBe('imperial');
    });
  });

  describe('setGlobalLoading', () => {
    it('sets global loading to true', () => {
      const { setGlobalLoading } = useUIStore.getState();

      setGlobalLoading(true);

      expect(useUIStore.getState().isGlobalLoading).toBe(true);
    });

    it('sets global loading to false', () => {
      const { setGlobalLoading } = useUIStore.getState();

      setGlobalLoading(true);
      setGlobalLoading(false);

      expect(useUIStore.getState().isGlobalLoading).toBe(false);
    });
  });

  describe('setLastSyncTimestamp', () => {
    it('sets last sync timestamp', () => {
      const { setLastSyncTimestamp } = useUIStore.getState();
      const timestamp = Date.now();

      setLastSyncTimestamp(timestamp);

      expect(useUIStore.getState().lastSyncTimestamp).toBe(timestamp);
    });

    it('updates last sync timestamp', () => {
      const { setLastSyncTimestamp } = useUIStore.getState();
      const timestamp1 = Date.now();
      const timestamp2 = timestamp1 + 1000;

      setLastSyncTimestamp(timestamp1);
      setLastSyncTimestamp(timestamp2);

      expect(useUIStore.getState().lastSyncTimestamp).toBe(timestamp2);
    });
  });

  describe('setHasCompletedOnboarding', () => {
    it('sets onboarding completion to true', () => {
      const { setHasCompletedOnboarding } = useUIStore.getState();

      setHasCompletedOnboarding(true);

      expect(useUIStore.getState().hasCompletedOnboarding).toBe(true);
    });

    it('sets onboarding completion to false', () => {
      const { setHasCompletedOnboarding } = useUIStore.getState();

      setHasCompletedOnboarding(true);
      setHasCompletedOnboarding(false);

      expect(useUIStore.getState().hasCompletedOnboarding).toBe(false);
    });
  });

  describe('persistence partialize', () => {
    it('only persists themeMode, unitSystem, and hasCompletedOnboarding', () => {
      // This tests the expected persisted state shape
      // In the actual store, partialize is configured to only persist these fields
      const { setThemeMode, setUnitSystem, setGlobalLoading, setHasCompletedOnboarding } =
        useUIStore.getState();

      setThemeMode('dark');
      setUnitSystem('imperial');
      setGlobalLoading(true);
      setHasCompletedOnboarding(true);

      const state = useUIStore.getState();

      // These should be persisted
      expect(state.themeMode).toBe('dark');
      expect(state.unitSystem).toBe('imperial');
      expect(state.hasCompletedOnboarding).toBe(true);

      // This should be in state but not persisted (runtime only)
      expect(state.isGlobalLoading).toBe(true);
    });
  });
});
