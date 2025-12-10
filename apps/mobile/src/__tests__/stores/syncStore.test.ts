import { useSyncStore } from '@/stores/syncStore';
import type { CheckInCreate, NutritionDayCreate } from '@/services/api/types';

// Storage is mocked globally in jest.setup.js

describe('syncStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    const { clearAllPending, clearSyncErrors, setSyncing } = useSyncStore.getState();
    clearAllPending();
    clearSyncErrors();
    setSyncing(false);
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { clearAllPending, clearSyncErrors } = useSyncStore.getState();
      clearAllPending();
      clearSyncErrors();

      const state = useSyncStore.getState();
      expect(state.pendingCheckins).toEqual([]);
      expect(state.pendingNutrition).toEqual([]);
      expect(state.isSyncing).toBe(false);
      expect(state.syncErrors).toEqual([]);
    });
  });

  describe('pending checkins', () => {
    const mockCheckinData: CheckInCreate = {
      date: '2024-01-15',
      weight_kg: 75.5,
      notes: 'Test check-in',
      client_updated_at: '2024-01-15T10:00:00.000Z',
    };

    it('adds pending checkin with local ID', () => {
      const { addPendingCheckin } = useSyncStore.getState();

      const localId = addPendingCheckin(mockCheckinData);

      expect(localId).toBeTruthy();
      expect(localId).toMatch(/^local_/);

      const state = useSyncStore.getState();
      expect(state.pendingCheckins).toHaveLength(1);
      expect(state.pendingCheckins[0].localId).toBe(localId);
      expect(state.pendingCheckins[0].data).toEqual(mockCheckinData);
      expect(state.pendingCheckins[0].attempts).toBe(0);
      expect(state.pendingCheckins[0].createdAt).toBeTruthy();
    });

    it('adds multiple pending checkins', () => {
      const { addPendingCheckin } = useSyncStore.getState();

      const localId1 = addPendingCheckin(mockCheckinData);
      const localId2 = addPendingCheckin({ ...mockCheckinData, date: '2024-01-16' });

      expect(localId1).not.toBe(localId2);
      expect(useSyncStore.getState().pendingCheckins).toHaveLength(2);
    });

    it('removes pending checkin by local ID', () => {
      const { addPendingCheckin, removePendingCheckin } = useSyncStore.getState();

      const localId = addPendingCheckin(mockCheckinData);
      expect(useSyncStore.getState().pendingCheckins).toHaveLength(1);

      removePendingCheckin(localId);

      expect(useSyncStore.getState().pendingCheckins).toHaveLength(0);
    });

    it('only removes matching checkin', () => {
      const { addPendingCheckin, removePendingCheckin } = useSyncStore.getState();

      const localId1 = addPendingCheckin(mockCheckinData);
      const localId2 = addPendingCheckin({ ...mockCheckinData, date: '2024-01-16' });

      removePendingCheckin(localId1);

      const state = useSyncStore.getState();
      expect(state.pendingCheckins).toHaveLength(1);
      expect(state.pendingCheckins[0].localId).toBe(localId2);
    });

    it('increments attempt count', () => {
      const { addPendingCheckin, incrementCheckinAttempts } = useSyncStore.getState();

      const localId = addPendingCheckin(mockCheckinData);
      expect(useSyncStore.getState().pendingCheckins[0].attempts).toBe(0);

      incrementCheckinAttempts(localId);
      expect(useSyncStore.getState().pendingCheckins[0].attempts).toBe(1);

      incrementCheckinAttempts(localId);
      expect(useSyncStore.getState().pendingCheckins[0].attempts).toBe(2);
    });

    it('removes checkin after 3 failed attempts (MAX_RETRY_ATTEMPTS)', () => {
      const { addPendingCheckin, incrementCheckinAttempts } = useSyncStore.getState();

      const localId = addPendingCheckin(mockCheckinData);

      incrementCheckinAttempts(localId); // attempts = 1
      incrementCheckinAttempts(localId); // attempts = 2
      incrementCheckinAttempts(localId); // attempts = 3, should be removed

      expect(useSyncStore.getState().pendingCheckins).toHaveLength(0);
    });

    it('keeps checkin until exactly 3 attempts', () => {
      const { addPendingCheckin, incrementCheckinAttempts } = useSyncStore.getState();

      const localId = addPendingCheckin(mockCheckinData);

      incrementCheckinAttempts(localId); // attempts = 1
      expect(useSyncStore.getState().pendingCheckins).toHaveLength(1);

      incrementCheckinAttempts(localId); // attempts = 2
      expect(useSyncStore.getState().pendingCheckins).toHaveLength(1);

      incrementCheckinAttempts(localId); // attempts = 3, removed
      expect(useSyncStore.getState().pendingCheckins).toHaveLength(0);
    });
  });

  describe('pending nutrition', () => {
    const mockNutritionData: NutritionDayCreate = {
      date: '2024-01-15',
      calories: 2000,
      protein_g: 150,
      carbs_g: 200,
      fat_g: 70,
    };

    it('adds pending nutrition with local ID', () => {
      const { addPendingNutrition } = useSyncStore.getState();

      const localId = addPendingNutrition(mockNutritionData);

      expect(localId).toBeTruthy();
      expect(localId).toMatch(/^local_/);

      const state = useSyncStore.getState();
      expect(state.pendingNutrition).toHaveLength(1);
      expect(state.pendingNutrition[0].localId).toBe(localId);
      expect(state.pendingNutrition[0].data).toEqual(mockNutritionData);
      expect(state.pendingNutrition[0].attempts).toBe(0);
    });

    it('removes pending nutrition by local ID', () => {
      const { addPendingNutrition, removePendingNutrition } = useSyncStore.getState();

      const localId = addPendingNutrition(mockNutritionData);
      expect(useSyncStore.getState().pendingNutrition).toHaveLength(1);

      removePendingNutrition(localId);

      expect(useSyncStore.getState().pendingNutrition).toHaveLength(0);
    });

    it('increments nutrition attempt count', () => {
      const { addPendingNutrition, incrementNutritionAttempts } = useSyncStore.getState();

      const localId = addPendingNutrition(mockNutritionData);

      incrementNutritionAttempts(localId);
      expect(useSyncStore.getState().pendingNutrition[0].attempts).toBe(1);
    });

    it('removes nutrition after 3 failed attempts', () => {
      const { addPendingNutrition, incrementNutritionAttempts } = useSyncStore.getState();

      const localId = addPendingNutrition(mockNutritionData);

      incrementNutritionAttempts(localId);
      incrementNutritionAttempts(localId);
      incrementNutritionAttempts(localId);

      expect(useSyncStore.getState().pendingNutrition).toHaveLength(0);
    });
  });

  describe('sync state', () => {
    it('sets syncing flag', () => {
      const { setSyncing } = useSyncStore.getState();

      setSyncing(true);
      expect(useSyncStore.getState().isSyncing).toBe(true);

      setSyncing(false);
      expect(useSyncStore.getState().isSyncing).toBe(false);
    });

    it('sets last sync timestamp', () => {
      const { setLastSyncAt } = useSyncStore.getState();
      const timestamp = Date.now();

      setLastSyncAt(timestamp);

      expect(useSyncStore.getState().lastSyncAt).toBe(timestamp);
    });

    it('adds sync error', () => {
      const { addSyncError } = useSyncStore.getState();

      addSyncError('Network error');

      const state = useSyncStore.getState();
      expect(state.syncErrors).toHaveLength(1);
      expect(state.syncErrors[0]).toBe('Network error');
    });

    it('keeps only last 10 sync errors', () => {
      const { addSyncError } = useSyncStore.getState();

      // Add 15 errors
      for (let i = 1; i <= 15; i++) {
        addSyncError(`Error ${i}`);
      }

      const state = useSyncStore.getState();
      expect(state.syncErrors).toHaveLength(10);
      // Should have errors 6-15 (last 10)
      expect(state.syncErrors[0]).toBe('Error 6');
      expect(state.syncErrors[9]).toBe('Error 15');
    });

    it('clears sync errors', () => {
      const { addSyncError, clearSyncErrors } = useSyncStore.getState();

      addSyncError('Error 1');
      addSyncError('Error 2');
      expect(useSyncStore.getState().syncErrors).toHaveLength(2);

      clearSyncErrors();

      expect(useSyncStore.getState().syncErrors).toEqual([]);
    });

    it('clears all pending items', () => {
      const { addPendingCheckin, addPendingNutrition, addSyncError, clearAllPending } =
        useSyncStore.getState();

      addPendingCheckin({
        date: '2024-01-15',
        client_updated_at: new Date().toISOString(),
      });
      addPendingNutrition({ date: '2024-01-15' });
      addSyncError('Test error');

      clearAllPending();

      const state = useSyncStore.getState();
      expect(state.pendingCheckins).toEqual([]);
      expect(state.pendingNutrition).toEqual([]);
      expect(state.syncErrors).toEqual([]);
    });

    it('returns correct pending count', () => {
      const { addPendingCheckin, addPendingNutrition, getPendingCount } = useSyncStore.getState();

      expect(getPendingCount()).toBe(0);

      addPendingCheckin({
        date: '2024-01-15',
        client_updated_at: new Date().toISOString(),
      });
      expect(useSyncStore.getState().getPendingCount()).toBe(1);

      addPendingNutrition({ date: '2024-01-15' });
      expect(useSyncStore.getState().getPendingCount()).toBe(2);

      addPendingCheckin({
        date: '2024-01-16',
        client_updated_at: new Date().toISOString(),
      });
      expect(useSyncStore.getState().getPendingCount()).toBe(3);
    });
  });
});
