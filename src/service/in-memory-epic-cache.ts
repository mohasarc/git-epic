import type { EpicCache, EpicCacheEntry } from './epic-cache.js';

const DEFAULT_MAX_ENTRIES = 1024;

export function createInMemoryEpicCache(maxEntries: number = DEFAULT_MAX_ENTRIES): EpicCache {
  const entries = new Map<string, EpicCacheEntry>();

  const touch = (handleKey: string, entry: EpicCacheEntry): void => {
    entries.delete(handleKey);
    entries.set(handleKey, entry);
  };

  return {
    async get(handleKey) {
      const entry = entries.get(handleKey);
      if (!entry) {
        return null;
      }
      touch(handleKey, entry);
      return entry;
    },

    async set(handleKey, entry) {
      touch(handleKey, entry);
      if (entries.size > maxEntries) {
        const leastRecentlyUsed = entries.keys().next().value;
        if (leastRecentlyUsed !== undefined) {
          entries.delete(leastRecentlyUsed);
        }
      }
    },
  };
}
