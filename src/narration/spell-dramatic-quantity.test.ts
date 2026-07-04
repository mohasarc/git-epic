import { describe, expect, it } from 'vitest';

import { spellDramaticQuantity } from './spell-dramatic-quantity.js';

describe('spellDramaticQuantity', () => {
  it('spells a single hundred with the article "a"', () => {
    expect(spellDramaticQuantity(100)).toBe('a hundred');
  });

  it('rounds down to the hundred below 1000', () => {
    expect(spellDramaticQuantity(350)).toBe('three hundred');
    expect(spellDramaticQuantity(999)).toBe('nine hundred');
  });

  it('spells a single thousand with the article "a"', () => {
    expect(spellDramaticQuantity(1000)).toBe('a thousand');
  });

  it('rounds down to the thousand up to 99999', () => {
    expect(spellDramaticQuantity(12345)).toBe('twelve thousand');
    expect(spellDramaticQuantity(99999)).toBe('ninety-nine thousand');
  });

  it('spells a single hundred thousand with the article "a"', () => {
    expect(spellDramaticQuantity(100000)).toBe('a hundred thousand');
  });

  it('rounds down to the hundred thousand above 99999', () => {
    expect(spellDramaticQuantity(400000)).toBe('four hundred thousand');
    expect(spellDramaticQuantity(456789)).toBe('four hundred thousand');
  });

  it('rejects counts below the smallest dramatic unit', () => {
    expect(() => spellDramaticQuantity(99)).toThrow(RangeError);
    expect(() => spellDramaticQuantity(0)).toThrow(RangeError);
    expect(() => spellDramaticQuantity(100.5)).toThrow(RangeError);
  });
});
