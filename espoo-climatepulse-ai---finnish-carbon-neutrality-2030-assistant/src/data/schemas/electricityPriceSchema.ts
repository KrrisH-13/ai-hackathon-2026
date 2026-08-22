import { z } from 'zod';
import { DataFreshnessSchema } from './commonSchema';

export const HourlyElectricityPriceSchema = z.object({
  timestamp: z.string(),
  hour: z.number().min(0).max(23),
  priceCentsPerKWh: z.number(),
  priceEurPerKWh: z.number(),
  area: z.string().default('FI'),
  source: z.string(),
  freshness: DataFreshnessSchema,
  isCleanPeak: z.boolean().default(false),
  isPriceValley: z.boolean().default(false),
});

export type HourlyElectricityPrice = z.infer<typeof HourlyElectricityPriceSchema>;

export const ElectricityPriceDaySchema = z.object({
  currentHourPriceCents: z.number(),
  averagePriceCents: z.number(),
  minPriceCents: z.number(),
  maxPriceCents: z.number(),
  bestSaunaWindow: z.string(),
  bestSaunaPriceCents: z.number(),
  hourlyPrices: z.array(HourlyElectricityPriceSchema),
  source: z.string(),
  freshness: DataFreshnessSchema,
  lastUpdated: z.string(),
});

export type ElectricityPriceDay = z.infer<typeof ElectricityPriceDaySchema>;
