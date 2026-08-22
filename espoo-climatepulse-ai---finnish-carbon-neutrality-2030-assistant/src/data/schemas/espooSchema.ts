import { z } from 'zod';
import { DataFreshnessSchema } from './commonSchema';

export const EspooRoadmapSectorSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameFi: z.string(),
  baseline1990Kt: z.number(),
  current2024Kt: z.number(),
  target2030Kt: z.number(),
  progressPercent: z.number(),
  color: z.string(),
  keyActions: z.array(z.string()),
});

export type EspooRoadmapSector = z.infer<typeof EspooRoadmapSectorSchema>;

export const EspooCityWatchSchema = z.object({
  targetYear: z.number().default(2030),
  baselineYear: z.number().default(1990),
  totalReductionTargetPercent: z.number().default(80),
  currentAchievedReductionPercent: z.number(),
  cityPopulation: z.number(),
  perCapitaEmissionsTonsCO2: z.number(),
  targetPerCapitaTonsCO2: z.number(),
  districtHeatingDecarbonizationYear: z.number().default(2026),
  sectors: z.array(EspooRoadmapSectorSchema),
  source: z.string(),
  freshness: DataFreshnessSchema,
  lastUpdated: z.string(),
});

export type EspooCityWatch = z.infer<typeof EspooCityWatchSchema>;
