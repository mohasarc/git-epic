import { describe, expect, it } from 'vitest';
import type { EpicCacheEntry } from './epic-cache.js';
import { createInMemoryEpicCache } from './in-memory-epic-cache.js';

function entry(document: string): EpicCacheEntry {
  return { document, renderedAtIso: '2026-07-05T00:00:00.000Z' };
}

describe('createInMemoryEpicCache', () => {
  it('stores and retrieves an entry by key', async () => {
    const cache = createInMemoryEpicCache();
    await cache.set('moha', entry('<svg>moha</svg>'));
    expect(await cache.get('moha')).toEqual(entry('<svg>moha</svg>'));
  });

  it('returns null for an unknown key', async () => {
    const cache = createInMemoryEpicCache();
    expect(await cache.get('nobody')).toBeNull();
  });

  it('evicts the least-recently-used entry once the cap is exceeded', async () => {
    const cache = createInMemoryEpicCache(2);
    await cache.set('a', entry('a'));
    await cache.set('b', entry('b'));
    await cache.set('c', entry('c'));

    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('b')).toEqual(entry('b'));
    expect(await cache.get('c')).toEqual(entry('c'));
  });

  it('counts a get as a use when choosing the eviction victim', async () => {
    const cache = createInMemoryEpicCache(2);
    await cache.set('a', entry('a'));
    await cache.set('b', entry('b'));
    await cache.get('a');
    await cache.set('c', entry('c'));

    expect(await cache.get('b')).toBeNull();
    expect(await cache.get('a')).toEqual(entry('a'));
    expect(await cache.get('c')).toEqual(entry('c'));
  });

  it('counts a re-set as a use and does not grow the entry count', async () => {
    const cache = createInMemoryEpicCache(2);
    await cache.set('a', entry('a'));
    await cache.set('b', entry('b'));
    await cache.set('a', entry('a2'));
    await cache.set('c', entry('c'));

    expect(await cache.get('b')).toBeNull();
    expect(await cache.get('a')).toEqual(entry('a2'));
    expect(await cache.get('c')).toEqual(entry('c'));
  });
});
