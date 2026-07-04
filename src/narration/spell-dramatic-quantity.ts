import { spellExactCount } from './spell-exact-count.js';

export function spellDramaticQuantity(count: number): string {
  if (!Number.isInteger(count) || count < 100) {
    throw new RangeError(`count must be an integer of at least 100, got: ${count}`);
  }
  if (count < 1000) return spellUnitMultiple(Math.floor(count / 100), 'hundred');
  if (count < 100000) return spellUnitMultiple(Math.floor(count / 1000), 'thousand');
  return spellUnitMultiple(Math.floor(count / 100000), 'hundred thousand');
}

function spellUnitMultiple(multiplier: number, unit: string): string {
  if (multiplier === 1) return `a ${unit}`;
  return `${spellExactCount(multiplier)} ${unit}`;
}
