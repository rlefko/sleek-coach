import { useAuthStore } from '@/stores/authStore';

// Storage is mocked globally in jest.setup.js

describe('authStore', () => {
  beforeEach(async () => {
    // Reset the store state before each test
    const { logout } = useAuthStore.getState();
    await logout();
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
    it('should set tokens and mark as authenticated', async () => {
      const { setTokens } = useAuthStore.getState();

      await setTokens('access-token-123', 'refresh-token-456');

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
    it('should clear all auth state', async () => {
      const { setTokens, setUser, logout } = useAuthStore.getState();

      // First, set up authenticated state
      await setTokens('access-token', 'refresh-token');
      setUser({
        id: 'user-123',
        email: 'test@example.com',
        isActive: true,
        isVerified: true,
      });

      // Verify authenticated
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Now logout
      await logout();

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

  describe('hydrate', () => {
    it('should set authenticated state when tokens exist in storage', async () => {
      // Mock secureStorage to return tokens (async)
      const secureStorage = require('@/lib/storage').secureStorage;
      secureStorage.getToken = jest.fn(async (key: string) => {
        if (key === 'accessToken') return 'stored-access-token';
        if (key === 'refreshToken') return 'stored-refresh-token';
        return null;
      });

      const { hydrate } = useAuthStore.getState();
      await hydrate();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('stored-access-token');
      expect(state.refreshToken).toBe('stored-refresh-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should not authenticate when tokens are missing', async () => {
      // Mock secureStorage to return null (no tokens, async)
      const secureStorage = require('@/lib/storage').secureStorage;
      secureStorage.getToken = jest.fn(async () => null);

      // Reset store state
      const { logout, hydrate } = useAuthStore.getState();
      await logout();

      await hydrate();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should not authenticate when only access token exists', async () => {
      // Mock secureStorage to return only access token (async)
      const secureStorage = require('@/lib/storage').secureStorage;
      secureStorage.getToken = jest.fn(async (key: string) => {
        if (key === 'accessToken') return 'stored-access-token';
        return null;
      });

      const { logout, hydrate } = useAuthStore.getState();
      await logout();

      await hydrate();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should not authenticate when only refresh token exists', async () => {
      // Mock secureStorage to return only refresh token (async)
      const secureStorage = require('@/lib/storage').secureStorage;
      secureStorage.getToken = jest.fn(async (key: string) => {
        if (key === 'refreshToken') return 'stored-refresh-token';
        return null;
      });

      const { logout, hydrate } = useAuthStore.getState();
      await logout();

      await hydrate();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });
});
