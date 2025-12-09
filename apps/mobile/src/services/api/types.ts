// API Types - matching backend schemas from apps/api/app/*/schemas.py

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshRequest {
  refresh_token: string;
}

// User
export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  profile: UserProfile | null;
  goal: UserGoal | null;
  preferences: DietPreferences | null;
}

export interface UserProfile {
  display_name: string | null;
  height_cm: number | null;
  sex: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  birth_year: number | null;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  timezone: string;
}

export interface UserProfileUpdate {
  display_name?: string;
  height_cm?: number;
  sex?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  birth_year?: number;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  timezone?: string;
}

export interface UserGoal {
  goal_type: 'fat_loss' | 'muscle_gain' | 'recomp' | 'maintenance' | 'performance';
  target_weight_kg: number | null;
  pace_preference: 'slow' | 'moderate' | 'aggressive';
  target_date: string | null;
}

export interface UserGoalUpdate {
  goal_type?: 'fat_loss' | 'muscle_gain' | 'recomp' | 'maintenance' | 'performance';
  target_weight_kg?: number | null;
  pace_preference?: 'slow' | 'moderate' | 'aggressive';
  target_date?: string | null;
}

export interface DietPreferences {
  diet_type: string;
  allergies: string[];
  disliked_foods: string[];
  meals_per_day: number;
  macro_targets: Record<string, number> | null;
}

export interface DietPreferencesUpdate {
  diet_type?: string;
  allergies?: string[];
  disliked_foods?: string[];
  meals_per_day?: number;
}

// Check-ins
export interface CheckIn {
  id: string;
  date: string;
  weight_kg: number | null;
  notes: string | null;
  energy_level: number | null;
  sleep_quality: number | null;
  mood: number | null;
  adherence_score: number | null;
  client_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckInCreate {
  date: string;
  weight_kg?: number;
  notes?: string;
  energy_level?: number;
  sleep_quality?: number;
  mood?: number;
  client_updated_at?: string;
}

export interface CheckInListResponse {
  items: CheckIn[];
  total: number;
  limit: number;
  offset: number;
}

export interface WeightTrendResponse {
  data: {
    date: string;
    weight_kg: number;
    moving_average_7d: number | null;
  }[];
  weekly_rate_of_change: number | null;
  total_change: number | null;
  start_weight: number | null;
  current_weight: number | null;
}

// Nutrition
export interface NutritionDay {
  id: string;
  date: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NutritionDayCreate {
  date: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  notes?: string;
}

export interface NutritionRangeResponse {
  items: NutritionDay[];
  total: number;
}

export interface MacroTargetsRequest {
  weight_kg: number;
  height_cm: number;
  age_years: number;
  sex: 'male' | 'female';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal_type: 'fat_loss' | 'muscle_gain' | 'recomp' | 'maintenance' | 'performance';
  pace_preference: 'slow' | 'moderate' | 'aggressive';
}

export interface MacroTargetsResponse {
  tdee: number;
  bmr: number;
  target_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  deficit_surplus: number;
  warnings: string[];
}

// Photos
export interface ProgressPhoto {
  id: string;
  date: string;
  s3_key: string;
  visibility: 'private' | 'coach_only';
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface PhotoPresignResponse {
  upload_url: string;
  photo_id: string;
  s3_key: string;
  expires_at: string;
}

// API Error
export interface ApiError {
  detail: string | { msg: string; type: string; loc: string[] }[];
  status: number;
}

// Generic list response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
