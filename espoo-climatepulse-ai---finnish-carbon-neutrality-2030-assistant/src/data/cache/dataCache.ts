import { CachedItem, DataFreshness } from '../schemas/commonSchema';

class SimpleDataCache {
  private cache = new Map<string, CachedItem<any>>();

  get<T>(key: string): { data: T; freshness: DataFreshness; ageSeconds: number } | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const age = Date.now() - item.cachedAt;
    const isExpired = age > item.ttlMs;

    return {
      data: item.data,
      freshness: isExpired ? 'cached' : item.freshness,
      ageSeconds: Math.floor(age / 1000),
    };
  }

  set<T>(key: string, data: T, ttlMs: number = 300000, freshness: DataFreshness = 'live', source: string = 'api') {
    this.cache.set(key, {
      data,
      cachedAt: Date.now(),
      ttlMs,
      freshness,
      source,
    });
  }

  clear() {
    this.cache.clear();
  }
}

export const globalDataCache = new SimpleDataCache();
