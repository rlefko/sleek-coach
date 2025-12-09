import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';

type GoalType = 'fat_loss' | 'muscle_gain' | 'recomp' | 'maintenance' | 'performance';
type Sex = 'male' | 'female' | 'other' | 'prefer_not_to_say';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type PacePreference = 'slow' | 'moderate' | 'aggressive';
type PhotoVisibility = 'private' | 'coach_only';

interface OnboardingData {
  // Goal selection
  goalType?: GoalType;

  // Baseline metrics
  currentWeightKg?: number;
  targetWeightKg?: number;
  heightCm?: number;
  birthYear?: number;
  sex?: Sex;
  activityLevel?: ActivityLevel;

  // Preferences
  pacePreference?: PacePreference;
  targetDate?: string;
  dietType?: string;
  allergies?: string[];
  dislikedFoods?: string[];
  mealsPerDay?: number;

  // Privacy
  allowWebSearch?: boolean;
  photoVisibility?: PhotoVisibility;
}

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  data: OnboardingData;
  isComplete: boolean;
}

interface OnboardingActions {
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateData: (data: Partial<OnboardingData>) => void;
  complete: () => void;
  reset: () => void;
}

const initialState: OnboardingState = {
  currentStep: 0,
  totalSteps: 5,
  data: {},
  isComplete: false,
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep, totalSteps } = get();
        if (currentStep < totalSteps - 1) {
          set({ currentStep: currentStep + 1 });
        }
      },

      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },

      updateData: (newData) =>
        set((state) => ({
          data: { ...state.data, ...newData },
        })),

      complete: () => set({ isComplete: true }),

      reset: () => set(initialState),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
