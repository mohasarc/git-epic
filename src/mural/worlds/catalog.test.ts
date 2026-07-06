import { describe, expect, it } from 'vitest';
import { WORLD_NAMES, worlds } from './catalog.js';
import { desert } from './desert.js';
import { river } from './river.js';

describe('worlds catalog', () => {
  it('freezes the three world names in append-only order', () => {
    expect(WORLD_NAMES).toHaveLength(3);
    expect([...WORLD_NAMES]).toEqual(['desert', 'river', 'mountain']);
  });

  it('maps every name to a real world entry', () => {
    for (const name of WORLD_NAMES) {
      expect(worlds[name]).toBeDefined();
    }
  });

  it('binds desert and river to their own worlds, mountain still aliasing desert', () => {
    expect(worlds.desert).toBe(desert);
    expect(worlds.river).toBe(river);
    expect(worlds.mountain).toBe(desert);
  });
});
