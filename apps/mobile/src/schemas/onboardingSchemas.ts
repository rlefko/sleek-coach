import { z } from 'zod';

// Enums matching backend exactly
export const goalTypeEnum = z.enum([
  'fat_loss',
  'muscle_gain',
  'recomp',
  'maintenance',
  'performance',
]);

export const sexEnum = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);

export const activityLevelEnum = z.enum([
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
]);

export const pacePreferenceEnum = z.enum(['slow', 'moderate', 'aggressive']);

export const dietTypeEnum = z.enum([
  'none',
  'vegetarian',
  'vegan',
  'pescatarian',
  'keto',
  'paleo',
  'halal',
  'kosher',
]);

export const photoVisibilityEnum = z.enum(['private', 'coach_only']);

// Step 1: Goal Selection
export const goalSelectionSchema = z.object({
  goalType: goalTypeEnum,
});

// Step 2: Baseline Metrics
const currentYear = new Date().getFullYear();
export const baselineMetricsSchema = z.object({
  currentWeightKg: z
    .number()
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Weight must be at most 500 kg'),
  targetWeightKg: z
    .number()
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Weight must be at most 500 kg')
    .optional()
    .nullable(),
  heightCm: z
    .number()
    .min(50, 'Height must be at least 50 cm')
    .max(300, 'Height must be at most 300 cm'),
  birthYear: z
    .number()
    .min(1900, 'Invalid birth year')
    .max(currentYear - 13, 'You must be at least 13 years old'),
  sex: sexEnum,
  activityLevel: activityLevelEnum,
});

// Step 3: Timeline Preferences
export const timelinePreferencesSchema = z.object({
  pacePreference: pacePreferenceEnum,
  targetDate: z.string().optional().nullable(),
});

// Step 4: Diet Preferences
export const dietPreferencesSchema = z.object({
  dietType: dietTypeEnum,
  allergies: z.array(z.string()).default([]),
  dislikedFoods: z.array(z.string()).default([]),
  mealsPerDay: z.number().min(1, 'At least 1 meal').max(10, 'Maximum 10 meals'),
});

// Step 5: Privacy Settings
export const privacySettingsSchema = z.object({
  allowWebSearch: z.boolean(),
  photoVisibility: photoVisibilityEnum,
  allowDataSharing: z.boolean(),
});

// Type exports
export type GoalType = z.infer<typeof goalTypeEnum>;
export type Sex = z.infer<typeof sexEnum>;
export type ActivityLevel = z.infer<typeof activityLevelEnum>;
export type PacePreference = z.infer<typeof pacePreferenceEnum>;
export type DietType = z.infer<typeof dietTypeEnum>;
export type PhotoVisibility = z.infer<typeof photoVisibilityEnum>;

export type GoalSelectionData = z.infer<typeof goalSelectionSchema>;
export type BaselineMetricsData = z.infer<typeof baselineMetricsSchema>;
export type TimelinePreferencesData = z.infer<typeof timelinePreferencesSchema>;
export type DietPreferencesData = z.infer<typeof dietPreferencesSchema>;
export type PrivacySettingsData = z.infer<typeof privacySettingsSchema>;

// Display labels for UI
export const goalTypeLabels: Record<GoalType, { title: string; description: string }> = {
  fat_loss: {
    title: 'Lose Fat',
    description: 'Reduce body fat while preserving muscle',
  },
  muscle_gain: {
    title: 'Build Muscle',
    description: 'Gain lean muscle mass',
  },
  recomp: {
    title: 'Body Recomposition',
    description: 'Lose fat and build muscle simultaneously',
  },
  maintenance: {
    title: 'Maintain Weight',
    description: 'Keep your current weight stable',
  },
  performance: {
    title: 'Improve Performance',
    description: 'Optimize for athletic performance',
  },
};

export const activityLevelLabels: Record<ActivityLevel, { title: string; description: string }> = {
  sedentary: {
    title: 'Sedentary',
    description: 'Little to no exercise, desk job',
  },
  light: {
    title: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
  },
  moderate: {
    title: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
  },
  active: {
    title: 'Active',
    description: 'Hard exercise 6-7 days/week',
  },
  very_active: {
    title: 'Very Active',
    description: 'Very hard exercise, physical job',
  },
};

export const pacePreferenceLabels: Record<PacePreference, { title: string; description: string }> =
  {
    slow: {
      title: 'Slow & Steady',
      description: '~0.25% body weight change per week',
    },
    moderate: {
      title: 'Moderate',
      description: '~0.5% body weight change per week',
    },
    aggressive: {
      title: 'Aggressive',
      description: '~1% body weight change per week',
    },
  };

export const dietTypeLabels: Record<DietType, string> = {
  none: 'No Restrictions',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  pescatarian: 'Pescatarian',
  keto: 'Keto',
  paleo: 'Paleo',
  halal: 'Halal',
  kosher: 'Kosher',
};
