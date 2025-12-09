import { apiClient } from './client';
import type {
  NutritionDay,
  NutritionDayCreate,
  NutritionRangeResponse,
  MacroTargetsRequest,
  MacroTargetsResponse,
} from './types';

export const nutritionService = {
  createOrUpdate: (data: NutritionDayCreate): Promise<NutritionDay> =>
    apiClient.post('/nutrition/day', data),

  getDay: (date: string): Promise<NutritionDay> => apiClient.get(`/nutrition/day?date=${date}`),

  getRange: (from: string, to: string): Promise<NutritionRangeResponse> =>
    apiClient.get(`/nutrition/range?from_date=${from}&to_date=${to}`),

  calculateTargets: (data: MacroTargetsRequest): Promise<MacroTargetsResponse> =>
    apiClient.post('/nutrition/calculate-targets', data),
};
