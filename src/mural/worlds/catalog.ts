import { desert } from './desert.js';
import { river } from './river.js';
import type { World, WorldName } from './world.js';

/**
 * Frozen, append-only-never-reorder: the hash default keys off this order (`% length`), so
 * a reorder would silently repaint every hash-defaulted user.
 */
export const WORLD_NAMES: readonly WorldName[] = ['desert', 'river', 'mountain'];

/**
 * The three worlds. `mountain` is still an explicit desert alias — a named placeholder the real
 * mountain overwrites in its phase, so every resolvable name already hits a real entry.
 */
export const worlds: Record<WorldName, World> = {
  desert,
  river,
  mountain: desert,
};
