import { checkinSchema, toCheckInCreate, CheckinFormData } from '@/schemas/checkinSchemas';

describe('checkinSchemas', () => {
  describe('checkinSchema', () => {
    it('validates minimal check-in with date only', () => {
      const result = checkinSchema.safeParse({
        date: '2024-01-15',
      });
      expect(result.success).toBe(true);
    });

    it('validates complete check-in with all fields', () => {
      const result = checkinSchema.safeParse({
        date: '2024-01-15',
        weight_kg: 75.5,
        notes: 'Feeling good today',
        energy_level: 4,
        sleep_quality: 5,
        mood: 3,
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty date', () => {
      const result = checkinSchema.safeParse({
        date: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('date');
      }
    });

    it('rejects weight below 20 kg', () => {
      const result = checkinSchema.safeParse({
        date: '2024-01-15',
        weight_kg: 19.9,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const weightError = result.error.issues.find((i) => i.path.includes('weight_kg'));
        expect(weightError?.message).toContain('20');
      }
    });

    it('rejects weight above 500 kg', () => {
      const result = checkinSchema.safeParse({
        date: '2024-01-15',
        weight_kg: 500.1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const weightError = result.error.issues.find((i) => i.path.includes('weight_kg'));
        expect(weightError?.message).toContain('500');
      }
    });

    it('accepts weight at lower bound (20 kg)', () => {
      const result = checkinSchema.safeParse({
        date: '2024-01-15',
        weight_kg: 20,
      });
      expect(result.success).toBe(true);
    });

    it('accepts weight at upper bound (500 kg)', () => {
      const result = checkinSchema.safeParse({
        date: '2024-01-15',
        weight_kg: 500,
      });
      expect(result.success).toBe(true);
    });

    it('rejects notes over 1000 characters', () => {
      const result = checkinSchema.safeParse({
        date: '2024-01-15',
        notes: 'a'.repeat(1001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const notesError = result.error.issues.find((i) => i.path.includes('notes'));
        expect(notesError?.message).toContain('1000');
      }
    });

    it('accepts notes at exactly 1000 characters', () => {
      const result = checkinSchema.safeParse({
        date: '2024-01-15',
        notes: 'a'.repeat(1000),
      });
      expect(result.success).toBe(true);
    });

    it('rejects energy_level below 1', () => {
      const result = checkinSchema.safeParse({
        date: '2024-01-15',
        energy_level: 0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects energy_level above 5', () => {
      const result = checkinSchema.safeParse({
        date: '2024-01-15',
        energy_level: 6,
      });
      expect(result.success).toBe(false);
    });

    it('accepts energy_level in valid range (1-5)', () => {
      [1, 2, 3, 4, 5].forEach((level) => {
        const result = checkinSchema.safeParse({
          date: '2024-01-15',
          energy_level: level,
        });
        expect(result.success).toBe(true);
      });
    });

    it('rejects sleep_quality outside 1-5', () => {
      const resultLow = checkinSchema.safeParse({
        date: '2024-01-15',
        sleep_quality: 0,
      });
      expect(resultLow.success).toBe(false);

      const resultHigh = checkinSchema.safeParse({
        date: '2024-01-15',
        sleep_quality: 6,
      });
      expect(resultHigh.success).toBe(false);
    });

    it('rejects mood outside 1-5', () => {
      const resultLow = checkinSchema.safeParse({
        date: '2024-01-15',
        mood: 0,
      });
      expect(resultLow.success).toBe(false);

      const resultHigh = checkinSchema.safeParse({
        date: '2024-01-15',
        mood: 6,
      });
      expect(resultHigh.success).toBe(false);
    });

    it('allows all optional fields to be undefined', () => {
      const result = checkinSchema.safeParse({
        date: '2024-01-15',
        weight_kg: undefined,
        notes: undefined,
        energy_level: undefined,
        sleep_quality: undefined,
        mood: undefined,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('toCheckInCreate', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('converts form data to API format', () => {
      const formData: CheckinFormData = {
        date: '2024-01-15',
        weight_kg: 75.5,
        notes: 'Test notes',
        energy_level: 4,
        sleep_quality: 5,
        mood: 3,
      };

      const result = toCheckInCreate(formData);

      expect(result).toEqual({
        date: '2024-01-15',
        weight_kg: 75.5,
        notes: 'Test notes',
        energy_level: 4,
        sleep_quality: 5,
        mood: 3,
        client_updated_at: '2024-01-15T10:00:00.000Z',
      });
    });

    it('adds client_updated_at timestamp', () => {
      const formData: CheckinFormData = {
        date: '2024-01-15',
      };

      const result = toCheckInCreate(formData);

      expect(result.client_updated_at).toBe('2024-01-15T10:00:00.000Z');
    });

    it('converts empty string notes to undefined', () => {
      const formData: CheckinFormData = {
        date: '2024-01-15',
        notes: '',
      };

      const result = toCheckInCreate(formData);

      expect(result.notes).toBeUndefined();
    });

    it('preserves non-empty notes', () => {
      const formData: CheckinFormData = {
        date: '2024-01-15',
        notes: 'Some notes',
      };

      const result = toCheckInCreate(formData);

      expect(result.notes).toBe('Some notes');
    });

    it('preserves optional metric values', () => {
      const formData: CheckinFormData = {
        date: '2024-01-15',
        energy_level: 3,
      };

      const result = toCheckInCreate(formData);

      expect(result.energy_level).toBe(3);
      expect(result.sleep_quality).toBeUndefined();
      expect(result.mood).toBeUndefined();
    });
  });
});
