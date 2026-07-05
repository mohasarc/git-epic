export type EpicCacheEntry = { document: string; renderedAtIso: string };

export interface EpicCache {
  get(handleKey: string): Promise<EpicCacheEntry | null>;
  set(handleKey: string, entry: EpicCacheEntry): Promise<void>;
}
