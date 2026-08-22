import { z } from 'zod';

export const DataFreshnessSchema = z.enum(['live', 'cached', 'demo']);
export type DataFreshness = z.infer<typeof DataFreshnessSchema>;

export const DataSourceMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  sourceUrl: z.string(),
  freshness: DataFreshnessSchema,
  lastUpdated: z.string(),
  cacheAgeSeconds: z.number().optional(),
  statusMessage: z.string().optional(),
});

export type DataSourceMeta = z.infer<typeof DataSourceMetaSchema>;

export interface CachedItem<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
  freshness: DataFreshness;
  source: string;
}
