import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';
import type {
  GoalType,
  Sex,
  ActivityLevel,
  PacePreference,
  DietType,
  PhotoVisibility,
} from '@/schemas/onboardingSchemas';

interface OnboardingData {
  // Step 1: Goal Selection
  goalType?: GoalType;

  // Step 2: Measurement System
  measurementSystem?: 'metric' | 'imperial';

  // Step 3: Baseline Metrics
  currentWeightKg?: number;
  targetWeightKg?: number;
  heightCm?: number;
  birthYear?: number;
  sex?: Sex;
  activityLevel?: ActivityLevel;

  // Step 4: Timeline Preferences
  pacePreference?: PacePreference;
  targetDate?: string | null;

  // Step 5: Diet Preferences
  dietType?: DietType;
  allergies?: string[];
  dislikedFoods?: string[];
  mealsPerDay?: number;

  // Step 6: Privacy Settings
  allowWebSearch?: boolean;
  photoVisibility?: PhotoVisibility;
  allowDataSharing?: boolean;
}

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  data: OnboardingData;
  isComplete: boolean;
  isSubmitting: boolean;
}

interface OnboardingActions {
  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateData: (data: Partial<OnboardingData>) => void;
  setSubmitting: (submitting: boolean) => void;
  complete: () => void;
  reset: () => void;
}

const initialState: OnboardingState = {
  currentStep: 0,
  totalSteps: 7,
  data: {
    // Default values
    measurementSystem: 'metric',
    mealsPerDay: 3,
    allergies: [],
    dislikedFoods: [],
    allowWebSearch: true,
    photoVisibility: 'private',
    allowDataSharing: false,
    pacePreference: 'moderate',
    dietType: 'none',
  },
  isComplete: false,
  isSubmitting: false,
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

      setSubmitting: (submitting) => set({ isSubmitting: submitting }),

      complete: () => set({ isComplete: true }),

      reset: () => set(initialState),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
