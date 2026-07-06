import { describe, expect, it } from 'vitest';
import { deriveSeedFromHandle } from '../../timeline/derive-seed-from-handle.js';
import { WORLD_NAMES } from './catalog.js';
import { resolveWorldName } from './resolve-world-name.js';

function hashDefault(handle: string): string {
  return WORLD_NAMES[deriveSeedFromHandle(handle.toLowerCase()) % WORLD_NAMES.length];
}

describe('resolveWorldName', () => {
  it('returns each exact lowercase world name unchanged', () => {
    for (const name of WORLD_NAMES) {
      expect(resolveWorldName(name, 'mohasarc')).toBe(name);
    }
  });

  it('hash-defaults on wrong case, empty, null, and unknown values', () => {
    for (const param of ['River', 'DESERT', 'Mountain', '', 'ocean', null]) {
      expect(resolveWorldName(param, 'mohasarc')).toBe(hashDefault('mohasarc'));
    }
  });

  it('picks a hash default that is one of the three worlds', () => {
    expect(WORLD_NAMES).toContain(resolveWorldName(null, 'mohasarc'));
  });

  it('hash-defaults deterministically for the same handle across calls', () => {
    expect(resolveWorldName(null, 'octocat')).toBe(resolveWorldName(null, 'octocat'));
    expect(resolveWorldName('ocean', 'torvalds')).toBe(resolveWorldName('ocean', 'torvalds'));
  });

  it('hash-defaults the same world for a raw-cased and normalized handle', () => {
    expect(resolveWorldName(null, 'Mohasarc')).toBe(resolveWorldName(null, 'mohasarc'));
  });
});
