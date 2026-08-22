import { z } from 'zod';
import { DataFreshnessSchema } from './commonSchema';

export const WeatherSnapshotSchema = z.object({
  location: z.string(),
  temperatureCelsius: z.number(),
  windSpeedMs: z.number(),
  weatherDescription: z.string(),
  heatingDegreeDayFactor: z.number(),
  season: z.enum(['winter', 'spring', 'summer', 'autumn']),
  recommendationHint: z.string(),
  source: z.string(),
  freshness: DataFreshnessSchema,
  lastUpdated: z.string(),
});

export type WeatherSnapshot = z.infer<typeof WeatherSnapshotSchema>;
