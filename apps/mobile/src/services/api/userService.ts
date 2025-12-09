import { apiClient } from './client';
import type {
  User,
  UserProfile,
  UserProfileUpdate,
  UserGoal,
  UserGoalUpdate,
  DietPreferences,
  DietPreferencesUpdate,
} from './types';

export const userService = {
  getMe: (): Promise<User> => apiClient.get('/me'),

  updateProfile: (data: UserProfileUpdate): Promise<UserProfile> =>
    apiClient.patch('/me/profile', data),

  updateGoals: (data: UserGoalUpdate): Promise<UserGoal> => apiClient.patch('/me/goals', data),

  updatePreferences: (data: DietPreferencesUpdate): Promise<DietPreferences> =>
    apiClient.patch('/me/preferences', data),
};
