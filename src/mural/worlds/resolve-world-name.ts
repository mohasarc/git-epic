import { deriveSeedFromHandle } from '../../timeline/derive-seed-from-handle.js';
import { WORLD_NAMES } from './catalog.js';
import type { WorldName } from './world.js';

/**
 * Strict lowercase-exact match against the frozen world set; anything else — wrong case, empty,
 * absent, unknown — hash-defaults off the normalized handle. The `% length` keys off WORLD_NAMES
 * order, so that order is an append-only-never-reorder contract.
 */
export function resolveWorldName(param: string | null, handle: string): WorldName {
  if (param !== null && (WORLD_NAMES as readonly string[]).includes(param)) {
    return param as WorldName;
  }
  const seed = deriveSeedFromHandle(handle.toLowerCase());
  return WORLD_NAMES[seed % WORLD_NAMES.length];
}
