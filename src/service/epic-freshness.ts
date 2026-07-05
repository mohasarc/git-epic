export const EPIC_FRESHNESS_MS = 86_400_000;

const MAX_CACHE_CONTROL_SECONDS = 86_400;
const MIN_CACHE_CONTROL_SECONDS = 300;

export function freshnessAgeMs(nowIso: string, renderedAtIso: string): number {
  return Date.parse(nowIso) - Date.parse(renderedAtIso);
}

export function isEpicFresh(nowIso: string, renderedAtIso: string): boolean {
  return freshnessAgeMs(nowIso, renderedAtIso) < EPIC_FRESHNESS_MS;
}

export function epicCacheControlSeconds(ageMs: number): number {
  const remainingSeconds = MAX_CACHE_CONTROL_SECONDS - Math.floor(ageMs / 1000);
  return Math.min(
    MAX_CACHE_CONTROL_SECONDS,
    Math.max(MIN_CACHE_CONTROL_SECONDS, remainingSeconds),
  );
}
