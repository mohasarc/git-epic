import { describe, expect, it } from 'vitest';
import { createSeededRandom } from './seeded-random.js';

describe('createSeededRandom', () => {
  it('produces the pinned sequence for the first-spark seed', () => {
    const random = createSeededRandom(3131498761);
    expect([random(), random(), random(), random(), random()]).toEqual([
      0.5499703832902014, 0.4474856813903898, 0.15048649325035512, 0.9021462281234562,
      0.9068327927961946,
    ]);
  });

  it('produces the pinned sequence for seed 0', () => {
    const random = createSeededRandom(0);
    expect([random(), random(), random()]).toEqual([
      0.26642920868471265, 0.0003297457005828619, 0.2232720274478197,
    ]);
  });

  it('keeps values in [0, 1)', () => {
    const random = createSeededRandom(0xffffffff);
    for (let draw = 0; draw < 1000; draw += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('gives independent generators the same stream for the same seed', () => {
    const first = createSeededRandom(42);
    const second = createSeededRandom(42);
    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });
});
