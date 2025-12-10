import { useAuthStore } from '@/stores/authStore';

// Storage is mocked globally in jest.setup.js

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
