import { z } from 'zod';

// Auth schemas - matching backend validation
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be at most 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\d/, 'Password must contain at least one digit')
      .regex(
        /[!@#$%^&*(),.?":{}|<>\-_=+[\]\\;'/`~]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Profile schema
export const profileSchema = z.object({
  displayName: z.string().max(100, 'Name must be at most 100 characters').optional(),
  heightCm: z
    .number()
    .min(50, 'Height must be at least 50 cm')
    .max(300, 'Height must be at most 300 cm')
    .optional(),
  birthYear: z
    .number()
    .min(1900, 'Birth year must be at least 1900')
    .max(new Date().getFullYear(), 'Birth year cannot be in the future')
    .optional(),
  sex: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
});

// Goal schema
export const goalSchema = z.object({
  goalType: z.enum(['fat_loss', 'muscle_gain', 'recomp', 'maintenance', 'performance']),
  targetWeightKg: z
    .number()
    .min(20, 'Target weight must be at least 20 kg')
    .max(500, 'Target weight must be at most 500 kg')
    .optional()
    .nullable(),
  pacePreference: z.enum(['slow', 'moderate', 'aggressive']),
  targetDate: z.string().optional().nullable(),
});

// Check-in schema
export const checkinSchema = z.object({
  date: z.string(),
  weightKg: z
    .number()
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Weight must be at most 500 kg')
    .optional(),
  notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
  energyLevel: z.number().min(1).max(5).optional(),
  sleepQuality: z.number().min(1).max(5).optional(),
  mood: z.number().min(1).max(5).optional(),
});

// Nutrition schema
export const nutritionSchema = z.object({
  date: z.string(),
  calories: z
    .number()
    .min(0, 'Calories must be positive')
    .max(50000, 'Calories must be at most 50,000')
    .optional(),
  proteinG: z
    .number()
    .min(0, 'Protein must be positive')
    .max(2000, 'Protein must be at most 2,000g')
    .optional(),
  carbsG: z
    .number()
    .min(0, 'Carbs must be positive')
    .max(2000, 'Carbs must be at most 2,000g')
    .optional(),
  fatG: z
    .number()
    .min(0, 'Fat must be positive')
    .max(1000, 'Fat must be at most 1,000g')
    .optional(),
  fiberG: z
    .number()
    .min(0, 'Fiber must be positive')
    .max(500, 'Fiber must be at most 500g')
    .optional(),
  notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
});

// Diet preferences schema
export const dietPreferencesSchema = z.object({
  dietType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  dislikedFoods: z.array(z.string()).optional(),
  mealsPerDay: z.number().min(1).max(10).optional(),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type GoalFormData = z.infer<typeof goalSchema>;
export type CheckinFormData = z.infer<typeof checkinSchema>;
export type NutritionFormData = z.infer<typeof nutritionSchema>;
export type DietPreferencesFormData = z.infer<typeof dietPreferencesSchema>;
