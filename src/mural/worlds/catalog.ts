import { desert } from './desert.js';
import type { World, WorldName } from './world.js';

/**
 * Frozen, append-only-never-reorder: the hash default keys off this order (`% length`), so
 * a reorder would silently repaint every hash-defaulted user.
 */
export const WORLD_NAMES: readonly WorldName[] = ['desert', 'river', 'mountain'];

/**
 * The three worlds. `river` and `mountain` are explicit desert aliases here — named
 * placeholders the real worlds overwrite in later phases, so every resolvable name already
 * hits a real entry.
 */
export const worlds: Record<WorldName, World> = {
  desert,
  river: desert,
  mountain: desert,
};
