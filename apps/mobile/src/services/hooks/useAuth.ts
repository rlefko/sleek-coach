import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, userService } from '../api';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/lib/queryKeys';
import type { LoginRequest, RegisterRequest } from '../api/types';

export const useLogin = () => {
  const { setTokens, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const tokens = await authService.login(data);
      setTokens(tokens.access_token, tokens.refresh_token);
      const user = await userService.getMe();
      setUser({
        id: user.id,
        email: user.email,
        isActive: user.is_active,
        isVerified: user.is_verified,
      });
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    },
  });
};

export const useRegister = () => {
  const { setTokens, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const tokens = await authService.register(data);
      setTokens(tokens.access_token, tokens.refresh_token);
      const user = await userService.getMe();
      setUser({
        id: user.id,
        email: user.email,
        isActive: user.is_active,
        isVerified: user.is_verified,
      });
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    },
  });
};

export const useLogout = () => {
  const { logout, refreshToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        try {
          await authService.logout(refreshToken);
        } catch {
          // Ignore logout errors, proceed with local cleanup
        }
      }
      logout();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};
