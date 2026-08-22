import { z } from 'zod';
import { DataFreshnessSchema } from './commonSchema';

export const HsyWasteClassificationSchema = z.object({
  itemName: z.string(),
  binCategory: z.string(),
  binColor: z.string(),
  instructions: z.string(),
  co2SavedVsMixedWasteGrams: z.number(),
  circularEconomyTip: z.string(),
  nearestSorttiStation: z.string().optional(),
  source: z.string(),
  freshness: DataFreshnessSchema,
});

export type HsyWasteClassification = z.infer<typeof HsyWasteClassificationSchema>;
