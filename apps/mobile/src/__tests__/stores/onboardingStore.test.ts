import { useOnboardingStore } from '@/stores/onboardingStore';

// Storage is mocked globally in jest.setup.js

describe('onboardingStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    const { reset } = useOnboardingStore.getState();
    reset();
  });

  describe('initial state', () => {
    it('initializes with correct defaults', () => {
      const { reset } = useOnboardingStore.getState();
      reset();

      const state = useOnboardingStore.getState();
      expect(state.currentStep).toBe(0);
      expect(state.totalSteps).toBe(7);
      expect(state.isComplete).toBe(false);
      expect(state.isSubmitting).toBe(false);
    });

    it('has default data values', () => {
      const { reset } = useOnboardingStore.getState();
      reset();

      const state = useOnboardingStore.getState();
      expect(state.data.measurementSystem).toBe('metric');
      expect(state.data.mealsPerDay).toBe(3);
      expect(state.data.allergies).toEqual([]);
      expect(state.data.dislikedFoods).toEqual([]);
      expect(state.data.allowWebSearch).toBe(true);
      expect(state.data.photoVisibility).toBe('private');
      expect(state.data.allowDataSharing).toBe(false);
      expect(state.data.pacePreference).toBe('moderate');
      expect(state.data.dietType).toBe('none');
    });
  });

  describe('setStep', () => {
    it('sets specific step', () => {
      const { setStep } = useOnboardingStore.getState();

      setStep(3);

      expect(useOnboardingStore.getState().currentStep).toBe(3);
    });

    it('can set to any valid step', () => {
      const { setStep } = useOnboardingStore.getState();

      [0, 1, 2, 3, 4, 5, 6].forEach((step) => {
        setStep(step);
        expect(useOnboardingStore.getState().currentStep).toBe(step);
      });
    });
  });

  describe('nextStep', () => {
    it('advances to next step', () => {
      const { nextStep } = useOnboardingStore.getState();
      expect(useOnboardingStore.getState().currentStep).toBe(0);

      nextStep();
      expect(useOnboardingStore.getState().currentStep).toBe(1);

      nextStep();
      expect(useOnboardingStore.getState().currentStep).toBe(2);
    });

    it('does not advance past totalSteps', () => {
      const { setStep, nextStep } = useOnboardingStore.getState();

      // Set to last step (totalSteps - 1 = 6)
      setStep(6);
      expect(useOnboardingStore.getState().currentStep).toBe(6);

      // Try to advance past last step
      nextStep();
      expect(useOnboardingStore.getState().currentStep).toBe(6);
    });

    it('stops at totalSteps - 1', () => {
      const { nextStep } = useOnboardingStore.getState();

      // Advance through all steps
      for (let i = 0; i < 10; i++) {
        nextStep();
      }

      expect(useOnboardingStore.getState().currentStep).toBe(6); // totalSteps - 1
    });
  });

  describe('previousStep', () => {
    it('goes to previous step', () => {
      const { setStep, previousStep } = useOnboardingStore.getState();

      setStep(3);
      previousStep();
      expect(useOnboardingStore.getState().currentStep).toBe(2);
    });

    it('does not go below step 0', () => {
      const { previousStep } = useOnboardingStore.getState();
      expect(useOnboardingStore.getState().currentStep).toBe(0);

      previousStep();
      expect(useOnboardingStore.getState().currentStep).toBe(0);
    });

    it('can navigate back through all steps', () => {
      const { setStep, previousStep } = useOnboardingStore.getState();

      setStep(5);
      expect(useOnboardingStore.getState().currentStep).toBe(5);

      previousStep();
      expect(useOnboardingStore.getState().currentStep).toBe(4);

      previousStep();
      expect(useOnboardingStore.getState().currentStep).toBe(3);
    });
  });

  describe('updateData', () => {
    it('updates partial data', () => {
      const { updateData } = useOnboardingStore.getState();

      updateData({ goalType: 'fat_loss' });

      expect(useOnboardingStore.getState().data.goalType).toBe('fat_loss');
    });

    it('merges new data with existing', () => {
      const { updateData } = useOnboardingStore.getState();

      updateData({ goalType: 'muscle_gain' });
      updateData({ currentWeightKg: 80 });

      const state = useOnboardingStore.getState();
      expect(state.data.goalType).toBe('muscle_gain');
      expect(state.data.currentWeightKg).toBe(80);
    });

    it('overwrites existing values', () => {
      const { updateData } = useOnboardingStore.getState();

      updateData({ goalType: 'fat_loss' });
      updateData({ goalType: 'muscle_gain' });

      expect(useOnboardingStore.getState().data.goalType).toBe('muscle_gain');
    });

    it('can update multiple fields at once', () => {
      const { updateData } = useOnboardingStore.getState();

      updateData({
        goalType: 'recomp',
        currentWeightKg: 75,
        heightCm: 180,
        birthYear: 1990,
        sex: 'male',
        activityLevel: 'active',
      });

      const state = useOnboardingStore.getState();
      expect(state.data.goalType).toBe('recomp');
      expect(state.data.currentWeightKg).toBe(75);
      expect(state.data.heightCm).toBe(180);
      expect(state.data.birthYear).toBe(1990);
      expect(state.data.sex).toBe('male');
      expect(state.data.activityLevel).toBe('active');
    });

    it('preserves default values when not updating them', () => {
      const { updateData } = useOnboardingStore.getState();

      updateData({ goalType: 'fat_loss' });

      const state = useOnboardingStore.getState();
      expect(state.data.mealsPerDay).toBe(3); // Default preserved
      expect(state.data.dietType).toBe('none'); // Default preserved
    });

    it('can update arrays', () => {
      const { updateData } = useOnboardingStore.getState();

      updateData({ allergies: ['nuts', 'dairy'] });
      expect(useOnboardingStore.getState().data.allergies).toEqual(['nuts', 'dairy']);

      updateData({ dislikedFoods: ['broccoli', 'spinach'] });
      expect(useOnboardingStore.getState().data.dislikedFoods).toEqual(['broccoli', 'spinach']);
    });
  });

  describe('setSubmitting', () => {
    it('sets submitting state to true', () => {
      const { setSubmitting } = useOnboardingStore.getState();

      setSubmitting(true);

      expect(useOnboardingStore.getState().isSubmitting).toBe(true);
    });

    it('sets submitting state to false', () => {
      const { setSubmitting } = useOnboardingStore.getState();

      setSubmitting(true);
      setSubmitting(false);

      expect(useOnboardingStore.getState().isSubmitting).toBe(false);
    });
  });

  describe('complete', () => {
    it('marks onboarding as complete', () => {
      const { complete } = useOnboardingStore.getState();

      complete();

      expect(useOnboardingStore.getState().isComplete).toBe(true);
    });
  });

  describe('reset', () => {
    it('resets to initial state', () => {
      const { updateData, setStep, setSubmitting, complete, reset } = useOnboardingStore.getState();

      // Make changes
      updateData({ goalType: 'fat_loss', currentWeightKg: 100 });
      setStep(4);
      setSubmitting(true);
      complete();

      // Verify changes
      expect(useOnboardingStore.getState().currentStep).toBe(4);
      expect(useOnboardingStore.getState().isComplete).toBe(true);

      // Reset
      reset();

      // Verify reset
      const state = useOnboardingStore.getState();
      expect(state.currentStep).toBe(0);
      expect(state.isComplete).toBe(false);
      expect(state.isSubmitting).toBe(false);
      expect(state.data.goalType).toBeUndefined();
      expect(state.data.currentWeightKg).toBeUndefined();
      expect(state.data.mealsPerDay).toBe(3); // Default restored
    });

    it('restores all default data values', () => {
      const { updateData, reset } = useOnboardingStore.getState();

      updateData({
        mealsPerDay: 5,
        dietType: 'vegan',
        pacePreference: 'aggressive',
      });

      reset();

      const state = useOnboardingStore.getState();
      expect(state.data.mealsPerDay).toBe(3);
      expect(state.data.dietType).toBe('none');
      expect(state.data.pacePreference).toBe('moderate');
    });
  });
});
