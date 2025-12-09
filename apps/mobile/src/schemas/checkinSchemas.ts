import { z } from 'zod';

export const checkinSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  weight_kg: z
    .number()
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Weight must be at most 500 kg')
    .optional(),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
  energy_level: z.number().min(1).max(5).optional(),
  sleep_quality: z.number().min(1).max(5).optional(),
  mood: z.number().min(1).max(5).optional(),
});

export type CheckinFormData = z.infer<typeof checkinSchema>;

// Helper to convert form data to API format
export function toCheckInCreate(data: CheckinFormData) {
  return {
    date: data.date,
    weight_kg: data.weight_kg,
    notes: data.notes || undefined,
    energy_level: data.energy_level,
    sleep_quality: data.sleep_quality,
    mood: data.mood,
    client_updated_at: new Date().toISOString(),
  };
}
