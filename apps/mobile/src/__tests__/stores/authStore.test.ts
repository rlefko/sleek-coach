import { useAuthStore } from '@/stores/authStore';

// Mock the storage module
jest.mock('@/lib/storage', () => {
  const mockStorage = new Map<string, string>();
  return {
    storage: {
      getString: jest.fn((key: string) => mockStorage.get(key)),
      set: jest.fn((key: string, value: string) => mockStorage.set(key, value)),
      delete: jest.fn((key: string) => mockStorage.delete(key)),
      contains: jest.fn((key: string) => mockStorage.has(key)),
      clearAll: jest.fn(() => mockStorage.clear()),
    },
    zustandStorage: {
      getItem: jest.fn((name: string) => mockStorage.get(name) ?? null),
      setItem: jest.fn((name: string, value: string) => mockStorage.set(name, value)),
      removeItem: jest.fn((name: string) => mockStorage.delete(name)),
    },
    secureStorage: {
      setToken: jest.fn((key: string, value: string) => mockStorage.set(key, value)),
      getToken: jest.fn((key: string) => mockStorage.get(key)),
      deleteToken: jest.fn((key: string) => mockStorage.delete(key)),
      hasToken: jest.fn((key: string) => mockStorage.has(key)),
    },
    storageHelpers: {
      set: jest.fn(),
      get: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  };
});

describe('authStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    const { logout } = useAuthStore.getState();
    logout();
  });

  describe('initial state', () => {
    it('should have correct initial state after logout', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setTokens', () => {
    it('should set tokens and mark as authenticated', () => {
      const { setTokens } = useAuthStore.getState();

      setTokens('access-token-123', 'refresh-token-456');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('access-token-123');
      expect(state.refreshToken).toBe('refresh-token-456');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('setUser', () => {
    it('should set the user', () => {
      const { setUser } = useAuthStore.getState();
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        isActive: true,
        isVerified: true,
      };

      setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should clear all auth state', () => {
      const { setTokens, setUser, logout } = useAuthStore.getState();

      // First, set up authenticated state
      setTokens('access-token', 'refresh-token');
      setUser({
        id: 'user-123',
        email: 'test@example.com',
        isActive: true,
        isVerified: true,
      });

      // Verify authenticated
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Now logout
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      const { setLoading } = useAuthStore.getState();

      setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
});
