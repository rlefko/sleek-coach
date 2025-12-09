import { z } from 'zod';

export const nutritionDaySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  calories: z
    .number()
    .min(0, 'Calories cannot be negative')
    .max(10000, 'Calories must be at most 10,000')
    .optional(),
  protein_g: z
    .number()
    .min(0, 'Protein cannot be negative')
    .max(1000, 'Protein must be at most 1,000g')
    .optional(),
  carbs_g: z
    .number()
    .min(0, 'Carbs cannot be negative')
    .max(1000, 'Carbs must be at most 1,000g')
    .optional(),
  fat_g: z
    .number()
    .min(0, 'Fat cannot be negative')
    .max(500, 'Fat must be at most 500g')
    .optional(),
  fiber_g: z
    .number()
    .min(0, 'Fiber cannot be negative')
    .max(200, 'Fiber must be at most 200g')
    .optional(),
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
});

export type NutritionDayFormData = z.infer<typeof nutritionDaySchema>;

// Calculate calories from macros (P*4 + C*4 + F*9)
export function calculateCaloriesFromMacros(
  protein?: number,
  carbs?: number,
  fat?: number
): number | undefined {
  if (protein === undefined && carbs === undefined && fat === undefined) {
    return undefined;
  }
  return (protein ?? 0) * 4 + (carbs ?? 0) * 4 + (fat ?? 0) * 9;
}

// Helper to convert form data to API format
export function toNutritionDayCreate(data: NutritionDayFormData) {
  return {
    date: data.date,
    calories: data.calories,
    protein_g: data.protein_g,
    carbs_g: data.carbs_g,
    fat_g: data.fat_g,
    fiber_g: data.fiber_g,
    notes: data.notes || undefined,
  };
}
