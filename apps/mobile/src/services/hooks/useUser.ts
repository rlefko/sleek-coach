import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, authService } from '../api';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import type {
  UserProfileUpdate,
  UserGoalUpdate,
  DietPreferencesUpdate,
  PasswordChangeRequest,
} from '../api/types';

export const useUser = () => {
  return useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: userService.getMe,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserProfileUpdate) => userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
    },
  });
};

export const useUpdateGoals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserGoalUpdate) => userService.updateGoals(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
    },
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DietPreferencesUpdate) => userService.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: PasswordChangeRequest) => authService.changePassword(data),
  });
};

export const useExportData = () => {
  return useMutation({
    mutationFn: () => userService.exportData(),
  });
};

export const useDeleteAccount = () => {
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: () => userService.deleteAccount(),
    onSuccess: () => {
      logout();
    },
  });
};
