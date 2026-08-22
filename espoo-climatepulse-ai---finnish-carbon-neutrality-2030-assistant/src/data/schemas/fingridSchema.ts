import { z } from 'zod';
import { DataFreshnessSchema } from './commonSchema';

export const FingridGridStatusSchema = z.object({
  timestamp: z.string(),
  consumptionMW: z.number(),
  productionMW: z.number(),
  windProductionMW: z.number(),
  nuclearProductionMW: z.number(),
  hydroProductionMW: z.number(),
  solarProductionMW: z.number(),
  netExportImportMW: z.number(),
  emissionFactorGCO2PerKWh: z.number(),
  systemStatus: z.object({
    timestamp: z.string(),
    state: z.string(),
    stateDescription: z.string(),
    surplusDeficitMW: z.number(),
    freshness: DataFreshnessSchema,
    source: z.string(),
  }),
  cleanEnergySharePercent: z.number(),
  source: z.string(),
  freshness: DataFreshnessSchema,
  lastUpdated: z.string(),
});

export type FingridGridStatus = z.infer<typeof FingridGridStatusSchema>;
