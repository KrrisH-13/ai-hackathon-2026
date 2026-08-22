import { z } from 'zod';
import { DataFreshnessSchema } from './commonSchema';

export const HslRoutePlanSchema = z.object({
  fromName: z.string(),
  toName: z.string(),
  distanceKm: z.number(),
  transitDurationMinutes: z.number(),
  carDurationMinutes: z.number(),
  transitLines: z.array(z.string()),
  transitMode: z.string(),
  transitCo2Grams: z.number(),
  carCo2Grams: z.number(),
  co2SavedGrams: z.number(),
  ticketPriceEur: z.number(),
  carCostEur: z.number(),
  costSavedEur: z.number(),
  source: z.string(),
  freshness: DataFreshnessSchema,
});

export type HslRoutePlan = z.infer<typeof HslRoutePlanSchema>;
