import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../api';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUIStore } from '@/stores/uiStore';
import { queryKeys } from '@/lib/queryKeys';

export const useSubmitOnboarding = () => {
  const queryClient = useQueryClient();
  const { data, reset: resetOnboarding } = useOnboardingStore();
  const { setHasCompletedOnboarding } = useUIStore();

  return useMutation({
    mutationFn: async () => {
      // Update profile
      await userService.updateProfile({
        height_cm: data.heightCm,
        sex: data.sex,
        birth_year: data.birthYear,
        activity_level: data.activityLevel,
      });

      // Update goals
      await userService.updateGoals({
        goal_type: data.goalType,
        target_weight_kg: data.targetWeightKg ?? null,
        pace_preference: data.pacePreference,
        target_date: data.targetDate ?? null,
      });

      // Update diet preferences
      await userService.updatePreferences({
        diet_type: data.dietType,
        allergies: data.allergies,
        disliked_foods: data.dislikedFoods,
        meals_per_day: data.mealsPerDay,
      });
    },
    onSuccess: () => {
      // Mark onboarding as complete
      setHasCompletedOnboarding(true);

      // Reset onboarding store
      resetOnboarding();

      // Invalidate user queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    },
  });
};
