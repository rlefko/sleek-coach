import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionService } from '../api';
import { queryKeys } from '@/lib/queryKeys';
import type { NutritionDayCreate, MacroTargetsRequest } from '../api/types';

export const useNutritionDay = (date: string) => {
  return useQuery({
    queryKey: queryKeys.nutrition.day(date),
    queryFn: () => nutritionService.getDay(date),
    enabled: !!date,
  });
};

export const useNutritionRange = (from: string, to: string) => {
  return useQuery({
    queryKey: queryKeys.nutrition.range(from, to),
    queryFn: () => nutritionService.getRange(from, to),
    enabled: !!from && !!to,
  });
};

export const useLogNutrition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NutritionDayCreate) => nutritionService.createOrUpdate(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.day(variables.date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.all });
    },
  });
};

export const useCalculateMacroTargets = () => {
  return useMutation({
    mutationFn: (data: MacroTargetsRequest) => nutritionService.calculateTargets(data),
  });
};
