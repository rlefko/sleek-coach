import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage, secureStorage } from '@/lib/storage';

interface User {
  id: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      // Actions
      setTokens: (accessToken, refreshToken) => {
        secureStorage.setToken('accessToken', accessToken);
        secureStorage.setToken('refreshToken', refreshToken);
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      setUser: (user) => {
        set({ user });
      },

      logout: () => {
        secureStorage.deleteToken('accessToken');
        secureStorage.deleteToken('refreshToken');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      hydrate: async () => {
        const accessToken = secureStorage.getToken('accessToken');
        const refreshToken = secureStorage.getToken('refreshToken');

        if (accessToken && refreshToken) {
          set({
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
