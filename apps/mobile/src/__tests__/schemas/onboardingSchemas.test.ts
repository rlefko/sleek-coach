import {
  goalTypeEnum,
  sexEnum,
  activityLevelEnum,
  pacePreferenceEnum,
  dietTypeEnum,
  photoVisibilityEnum,
  goalSelectionSchema,
  baselineMetricsSchema,
  timelinePreferencesSchema,
  dietPreferencesSchema,
  privacySettingsSchema,
} from '@/schemas/onboardingSchemas';

describe('onboardingSchemas', () => {
  describe('goalTypeEnum', () => {
    it('accepts all valid goal types', () => {
      const validTypes = ['fat_loss', 'muscle_gain', 'recomp', 'maintenance', 'performance'];
      validTypes.forEach((type) => {
        const result = goalTypeEnum.safeParse(type);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid goal type', () => {
      const result = goalTypeEnum.safeParse('invalid_goal');
      expect(result.success).toBe(false);
    });
  });

  describe('sexEnum', () => {
    it('accepts all valid sex options', () => {
      const validOptions = ['male', 'female', 'other', 'prefer_not_to_say'];
      validOptions.forEach((option) => {
        const result = sexEnum.safeParse(option);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid sex option', () => {
      const result = sexEnum.safeParse('invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('activityLevelEnum', () => {
    it('accepts all valid activity levels', () => {
      const validLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
      validLevels.forEach((level) => {
        const result = activityLevelEnum.safeParse(level);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid activity level', () => {
      const result = activityLevelEnum.safeParse('super_active');
      expect(result.success).toBe(false);
    });
  });

  describe('pacePreferenceEnum', () => {
    it('accepts all valid pace preferences', () => {
      const validPaces = ['slow', 'moderate', 'aggressive'];
      validPaces.forEach((pace) => {
        const result = pacePreferenceEnum.safeParse(pace);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid pace preference', () => {
      const result = pacePreferenceEnum.safeParse('fast');
      expect(result.success).toBe(false);
    });
  });

  describe('dietTypeEnum', () => {
    it('accepts all valid diet types', () => {
      const validDiets = [
        'none',
        'vegetarian',
        'vegan',
        'pescatarian',
        'keto',
        'paleo',
        'halal',
        'kosher',
      ];
      validDiets.forEach((diet) => {
        const result = dietTypeEnum.safeParse(diet);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid diet type', () => {
      const result = dietTypeEnum.safeParse('carnivore');
      expect(result.success).toBe(false);
    });
  });

  describe('photoVisibilityEnum', () => {
    it('accepts all valid photo visibility options', () => {
      const validOptions = ['private', 'coach_only'];
      validOptions.forEach((option) => {
        const result = photoVisibilityEnum.safeParse(option);
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid photo visibility', () => {
      const result = photoVisibilityEnum.safeParse('public');
      expect(result.success).toBe(false);
    });
  });

  describe('goalSelectionSchema', () => {
    it('validates valid goal selection', () => {
      const result = goalSelectionSchema.safeParse({
        goalType: 'fat_loss',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid goal type', () => {
      const result = goalSelectionSchema.safeParse({
        goalType: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing goal type', () => {
      const result = goalSelectionSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('baselineMetricsSchema', () => {
    const validMetrics = {
      currentWeightKg: 80,
      heightCm: 175,
      birthYear: 1990,
      sex: 'male' as const,
      activityLevel: 'moderate' as const,
    };

    it('validates complete metrics', () => {
      const result = baselineMetricsSchema.safeParse(validMetrics);
      expect(result.success).toBe(true);
    });

    it('validates metrics with optional target weight', () => {
      const result = baselineMetricsSchema.safeParse({
        ...validMetrics,
        targetWeightKg: 75,
      });
      expect(result.success).toBe(true);
    });

    it('allows null target weight', () => {
      const result = baselineMetricsSchema.safeParse({
        ...validMetrics,
        targetWeightKg: null,
      });
      expect(result.success).toBe(true);
    });

    it('rejects weight below 20 kg', () => {
      const result = baselineMetricsSchema.safeParse({
        ...validMetrics,
        currentWeightKg: 19,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const weightError = result.error.issues.find((i) => i.path.includes('currentWeightKg'));
        expect(weightError?.message).toContain('20');
      }
    });

    it('rejects weight above 500 kg', () => {
      const result = baselineMetricsSchema.safeParse({
        ...validMetrics,
        currentWeightKg: 501,
      });
      expect(result.success).toBe(false);
    });

    it('rejects height below 50 cm', () => {
      const result = baselineMetricsSchema.safeParse({
        ...validMetrics,
        heightCm: 49,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const heightError = result.error.issues.find((i) => i.path.includes('heightCm'));
        expect(heightError?.message).toContain('50');
      }
    });

    it('rejects height above 300 cm', () => {
      const result = baselineMetricsSchema.safeParse({
        ...validMetrics,
        heightCm: 301,
      });
      expect(result.success).toBe(false);
    });

    it('rejects birth year before 1900', () => {
      const result = baselineMetricsSchema.safeParse({
        ...validMetrics,
        birthYear: 1899,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const yearError = result.error.issues.find((i) => i.path.includes('birthYear'));
        expect(yearError?.message).toContain('birth year');
      }
    });

    it('rejects birth year for under 13 years old', () => {
      const currentYear = new Date().getFullYear();
      const result = baselineMetricsSchema.safeParse({
        ...validMetrics,
        birthYear: currentYear - 12,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const yearError = result.error.issues.find((i) => i.path.includes('birthYear'));
        expect(yearError?.message).toContain('13');
      }
    });

    it('accepts birth year for exactly 13 years old', () => {
      const currentYear = new Date().getFullYear();
      const result = baselineMetricsSchema.safeParse({
        ...validMetrics,
        birthYear: currentYear - 13,
      });
      expect(result.success).toBe(true);
    });

    it('validates all sex options', () => {
      const sexOptions = ['male', 'female', 'other', 'prefer_not_to_say'];
      sexOptions.forEach((sex) => {
        const result = baselineMetricsSchema.safeParse({
          ...validMetrics,
          sex,
        });
        expect(result.success).toBe(true);
      });
    });

    it('validates all activity levels', () => {
      const activityLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
      activityLevels.forEach((level) => {
        const result = baselineMetricsSchema.safeParse({
          ...validMetrics,
          activityLevel: level,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('timelinePreferencesSchema', () => {
    it('validates with pace preference only', () => {
      const result = timelinePreferencesSchema.safeParse({
        pacePreference: 'moderate',
      });
      expect(result.success).toBe(true);
    });

    it('validates with target date', () => {
      const result = timelinePreferencesSchema.safeParse({
        pacePreference: 'slow',
        targetDate: '2024-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('allows null targetDate', () => {
      const result = timelinePreferencesSchema.safeParse({
        pacePreference: 'aggressive',
        targetDate: null,
      });
      expect(result.success).toBe(true);
    });

    it('allows undefined targetDate', () => {
      const result = timelinePreferencesSchema.safeParse({
        pacePreference: 'moderate',
        targetDate: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('validates all pace preferences', () => {
      const paces = ['slow', 'moderate', 'aggressive'];
      paces.forEach((pace) => {
        const result = timelinePreferencesSchema.safeParse({
          pacePreference: pace,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('dietPreferencesSchema', () => {
    it('validates minimal diet preferences', () => {
      const result = dietPreferencesSchema.safeParse({
        dietType: 'none',
        mealsPerDay: 3,
      });
      expect(result.success).toBe(true);
    });

    it('validates complete diet preferences', () => {
      const result = dietPreferencesSchema.safeParse({
        dietType: 'vegetarian',
        allergies: ['nuts', 'dairy'],
        dislikedFoods: ['broccoli'],
        mealsPerDay: 4,
      });
      expect(result.success).toBe(true);
    });

    it('defaults allergies to empty array', () => {
      const result = dietPreferencesSchema.safeParse({
        dietType: 'none',
        mealsPerDay: 3,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allergies).toEqual([]);
      }
    });

    it('defaults dislikedFoods to empty array', () => {
      const result = dietPreferencesSchema.safeParse({
        dietType: 'none',
        mealsPerDay: 3,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dislikedFoods).toEqual([]);
      }
    });

    it('rejects mealsPerDay below 1', () => {
      const result = dietPreferencesSchema.safeParse({
        dietType: 'none',
        mealsPerDay: 0,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const mealsError = result.error.issues.find((i) => i.path.includes('mealsPerDay'));
        expect(mealsError?.message).toContain('1');
      }
    });

    it('rejects mealsPerDay above 10', () => {
      const result = dietPreferencesSchema.safeParse({
        dietType: 'none',
        mealsPerDay: 11,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const mealsError = result.error.issues.find((i) => i.path.includes('mealsPerDay'));
        expect(mealsError?.message).toContain('10');
      }
    });

    it('validates all diet types', () => {
      const dietTypes = [
        'none',
        'vegetarian',
        'vegan',
        'pescatarian',
        'keto',
        'paleo',
        'halal',
        'kosher',
      ];
      dietTypes.forEach((diet) => {
        const result = dietPreferencesSchema.safeParse({
          dietType: diet,
          mealsPerDay: 3,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('privacySettingsSchema', () => {
    it('validates complete privacy settings', () => {
      const result = privacySettingsSchema.safeParse({
        allowWebSearch: true,
        photoVisibility: 'private',
        allowDataSharing: false,
      });
      expect(result.success).toBe(true);
    });

    it('validates all photoVisibility options', () => {
      const options = ['private', 'coach_only'];
      options.forEach((option) => {
        const result = privacySettingsSchema.safeParse({
          allowWebSearch: true,
          photoVisibility: option,
          allowDataSharing: false,
        });
        expect(result.success).toBe(true);
      });
    });

    it('validates boolean fields', () => {
      const result = privacySettingsSchema.safeParse({
        allowWebSearch: false,
        photoVisibility: 'coach_only',
        allowDataSharing: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-boolean for allowWebSearch', () => {
      const result = privacySettingsSchema.safeParse({
        allowWebSearch: 'yes',
        photoVisibility: 'private',
        allowDataSharing: false,
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid photoVisibility', () => {
      const result = privacySettingsSchema.safeParse({
        allowWebSearch: true,
        photoVisibility: 'public',
        allowDataSharing: false,
      });
      expect(result.success).toBe(false);
    });
  });
});
