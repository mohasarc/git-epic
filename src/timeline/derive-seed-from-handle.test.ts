import { describe, expect, it } from 'vitest';

import { deriveSeedFromHandle } from './derive-seed-from-handle.js';

describe('deriveSeedFromHandle', () => {
  // Pinned FNV-1a 32-bit values; catch cross-platform/refactor drift.
  it.each([
    ['first-spark', 3131498761],
    ['unwritten-legend', 2190956661],
    ['octocat', 344042070],
    ['torvalds', 2445434708],
  ])('derives pinned seed for %s', (handle, seed) => {
    expect(deriveSeedFromHandle(handle)).toBe(seed);
  });

  it('is deterministic', () => {
    expect(deriveSeedFromHandle('first-spark')).toBe(deriveSeedFromHandle('first-spark'));
  });
});
