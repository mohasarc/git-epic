import { describe, expect, it } from 'vitest';
import { Y_BANDS } from './mural-vocabulary.js';
import type { EraPlacement } from './era-widths.js';
import { allocateSlots } from './allocate-slots.js';

const PLACEMENT: EraPlacement = { x: 100, width: 200 };

describe('allocateSlots geometry', () => {
  it('allocates non-overlapping slots left to right inside the era span', () => {
    const slots = allocateSlots(PLACEMENT, 'town', 20);
    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) {
      expect(slot.x).toBeGreaterThanOrEqual(PLACEMENT.x);
      expect(slot.x + slot.width).toBeLessThanOrEqual(PLACEMENT.x + PLACEMENT.width + 1e-9);
      expect(slot.baselineY).toBe(Y_BANDS.roadBaseline);
    }
    for (let index = 0; index + 1 < slots.length; index++) {
      expect(slots[index].x + slots[index].width).toBeLessThanOrEqual(slots[index + 1].x + 1e-9);
    }
  });

  it('scales slot and structure counts with worldScale on the same era', () => {
    const camp = allocateSlots(PLACEMENT, 'camp', 20);
    const town = allocateSlots(PLACEMENT, 'town', 20);
    const metropolis = allocateSlots(PLACEMENT, 'metropolis', 20);
    expect(camp.length).toBeLessThan(town.length);
    expect(town.length).toBeLessThan(metropolis.length);
    const structures = (slots: ReturnType<typeof allocateSlots>) =>
      slots.filter((slot) => slot.type === 'structure').length;
    expect(structures(camp)).toBeLessThan(structures(metropolis));
  });

  it('grace floors a single-contribution camp era to at least one structure', () => {
    const slots = allocateSlots(PLACEMENT, 'camp', 1);
    expect(slots.filter((slot) => slot.type === 'structure').length).toBeGreaterThanOrEqual(1);
  });
});
