import {
  nutritionDaySchema,
  calculateCaloriesFromMacros,
  toNutritionDayCreate,
  NutritionDayFormData,
} from '@/schemas/nutritionSchemas';

describe('nutritionSchemas', () => {
  describe('nutritionDaySchema', () => {
    it('validates minimal nutrition day with date', () => {
      const result = nutritionDaySchema.safeParse({
        date: '2024-01-15',
      });
      expect(result.success).toBe(true);
    });

    it('validates complete nutrition day', () => {
      const result = nutritionDaySchema.safeParse({
        date: '2024-01-15',
        calories: 2000,
        protein_g: 150,
        carbs_g: 200,
        fat_g: 70,
        fiber_g: 30,
        notes: 'Good eating day',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty date', () => {
      const result = nutritionDaySchema.safeParse({
        date: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative calories', () => {
      const result = nutritionDaySchema.safeParse({
        date: '2024-01-15',
        calories: -1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const caloriesError = result.error.issues.find((i) => i.path.includes('calories'));
        expect(caloriesError?.message).toContain('negative');
      }
    });

    it('rejects calories over 10000', () => {
      const result = nutritionDaySchema.safeParse({
        date: '2024-01-15',
        calories: 10001,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const caloriesError = result.error.issues.find((i) => i.path.includes('calories'));
        expect(caloriesError?.message).toContain('10,000');
      }
    });

    it('accepts calories at boundaries', () => {
      const resultZero = nutritionDaySchema.safeParse({
        date: '2024-01-15',
        calories: 0,
      });
      expect(resultZero.success).toBe(true);

      const resultMax = nutritionDaySchema.safeParse({
        date: '2024-01-15',
        calories: 10000,
      });
      expect(resultMax.success).toBe(true);
    });

    it('rejects negative protein', () => {
      const result = nutritionDaySchema.safeParse({
        date: '2024-01-15',
        protein_g: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects protein over 1000g', () => {
      const result = nutritionDaySchema.safeParse({
        date: '2024-01-15',
        protein_g: 1001,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const proteinError = result.error.issues.find((i) => i.path.includes('protein_g'));
        expect(proteinError?.message).toContain('1,000');
      }
    });

    it('rejects negative carbs', () => {
      const result = nutritionDaySchema.safeParse({
        date: '2024-01-15',
        carbs_g: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects carbs over 1000g', () => {
      const result = nutritionDaySchema.safeParse({
        date: '2024-01-15',
        carbs_g: 1001,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative fat', () => {
      const result = nutritionDaySchema.safeParse({
        date: '2024-01-15',
        fat_g: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects fat over 500g', () => {
      const result = nutritionDaySchema.safeParse({
        date: '2024-01-15',
        fat_g: 501,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fatError = result.error.issues.find((i) => i.path.includes('fat_g'));
        expect(fatError?.message).toContain('500');
      }
    });

    it('rejects negative fiber', () => {
      const result = nutritionDaySchema.safeParse({
        date: '2024-01-15',
        fiber_g: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects fiber over 200g', () => {
      const result = nutritionDaySchema.safeParse({
        date: '2024-01-15',
        fiber_g: 201,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fiberError = result.error.issues.find((i) => i.path.includes('fiber_g'));
        expect(fiberError?.message).toContain('200');
      }
    });

    it('rejects notes over 500 characters', () => {
      const result = nutritionDaySchema.safeParse({
        date: '2024-01-15',
        notes: 'a'.repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const notesError = result.error.issues.find((i) => i.path.includes('notes'));
        expect(notesError?.message).toContain('500');
      }
    });

    it('accepts notes at exactly 500 characters', () => {
      const result = nutritionDaySchema.safeParse({
        date: '2024-01-15',
        notes: 'a'.repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it('allows all optional fields to be undefined', () => {
      const result = nutritionDaySchema.safeParse({
        date: '2024-01-15',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('calculateCaloriesFromMacros', () => {
    it('returns undefined when all macros undefined', () => {
      const result = calculateCaloriesFromMacros(undefined, undefined, undefined);
      expect(result).toBeUndefined();
    });

    it('calculates P*4 + C*4 + F*9 correctly', () => {
      // 100g protein (400 cal) + 200g carbs (800 cal) + 50g fat (450 cal) = 1650 cal
      const result = calculateCaloriesFromMacros(100, 200, 50);
      expect(result).toBe(1650);
    });

    it('handles protein only', () => {
      const result = calculateCaloriesFromMacros(100, undefined, undefined);
      expect(result).toBe(400); // 100 * 4
    });

    it('handles carbs only', () => {
      const result = calculateCaloriesFromMacros(undefined, 100, undefined);
      expect(result).toBe(400); // 100 * 4
    });

    it('handles fat only', () => {
      const result = calculateCaloriesFromMacros(undefined, undefined, 100);
      expect(result).toBe(900); // 100 * 9
    });

    it('handles partial macros (missing values treated as 0)', () => {
      // Protein and carbs only
      const result = calculateCaloriesFromMacros(50, 100, undefined);
      expect(result).toBe(600); // 50*4 + 100*4 + 0*9 = 200 + 400 = 600
    });

    it('handles zero values', () => {
      const result = calculateCaloriesFromMacros(0, 0, 0);
      expect(result).toBe(0);
    });

    it('handles decimal values', () => {
      const result = calculateCaloriesFromMacros(50.5, 100.5, 25.5);
      // 50.5*4 + 100.5*4 + 25.5*9 = 202 + 402 + 229.5 = 833.5
      expect(result).toBe(833.5);
    });
  });

  describe('toNutritionDayCreate', () => {
    it('converts form data to API format', () => {
      const formData: NutritionDayFormData = {
        date: '2024-01-15',
        calories: 2000,
        protein_g: 150,
        carbs_g: 200,
        fat_g: 70,
        fiber_g: 30,
        notes: 'Test notes',
      };

      const result = toNutritionDayCreate(formData);

      expect(result).toEqual({
        date: '2024-01-15',
        calories: 2000,
        protein_g: 150,
        carbs_g: 200,
        fat_g: 70,
        fiber_g: 30,
        notes: 'Test notes',
      });
    });

    it('converts empty string notes to undefined', () => {
      const formData: NutritionDayFormData = {
        date: '2024-01-15',
        notes: '',
      };

      const result = toNutritionDayCreate(formData);

      expect(result.notes).toBeUndefined();
    });

    it('preserves undefined optional fields', () => {
      const formData: NutritionDayFormData = {
        date: '2024-01-15',
      };

      const result = toNutritionDayCreate(formData);

      expect(result.calories).toBeUndefined();
      expect(result.protein_g).toBeUndefined();
      expect(result.carbs_g).toBeUndefined();
      expect(result.fat_g).toBeUndefined();
      expect(result.fiber_g).toBeUndefined();
    });

    it('preserves zero values', () => {
      const formData: NutritionDayFormData = {
        date: '2024-01-15',
        calories: 0,
        protein_g: 0,
      };

      const result = toNutritionDayCreate(formData);

      expect(result.calories).toBe(0);
      expect(result.protein_g).toBe(0);
    });
  });
});
