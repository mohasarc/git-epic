import { describe, expect, it } from 'vitest';

import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import type { RepositorySummary } from '../history-snapshot.js';
import { deriveAmbientScene } from './derive-ambient-scene.js';

function repository(starCount: number): RepositorySummary {
  return {
    name: `repo-${starCount}`,
    createdDate: '2020-01-01',
    lastPushedDate: '2020-06-01',
    starCount,
    primaryLanguage: 'TypeScript',
  };
}

function snapshotWith(repositoryStarCounts: number[]) {
  return buildHistorySnapshot({ repositories: repositoryStarCounts.map(repository) });
}

describe('deriveAmbientScene', () => {
  it('floors the orbiting body count at 1 for a zero-history snapshot', () => {
    expect(deriveAmbientScene(snapshotWith([]))).toEqual({
      orbitingBodyCount: 1,
      twinkleStarCount: 8,
    });
  });

  it.each([
    { repositoryCount: 0, orbitingBodyCount: 1 },
    { repositoryCount: 1, orbitingBodyCount: 1 },
    { repositoryCount: 2, orbitingBodyCount: 2 },
    { repositoryCount: 4, orbitingBodyCount: 4 },
    { repositoryCount: 5, orbitingBodyCount: 5 },
    { repositoryCount: 6, orbitingBodyCount: 5 },
    { repositoryCount: 40, orbitingBodyCount: 5 },
  ])(
    'maps $repositoryCount repositories to $orbitingBodyCount orbiting bodies',
    ({ repositoryCount, orbitingBodyCount }) => {
      const snapshot = snapshotWith(Array.from({ length: repositoryCount }, () => 0));
      expect(deriveAmbientScene(snapshot).orbitingBodyCount).toBe(orbitingBodyCount);
    },
  );

  it.each([
    { totalStars: 0, twinkleStarCount: 8 },
    { totalStars: 9, twinkleStarCount: 8 },
    { totalStars: 10, twinkleStarCount: 10 },
    { totalStars: 99, twinkleStarCount: 10 },
    { totalStars: 100, twinkleStarCount: 12 },
    { totalStars: 999, twinkleStarCount: 12 },
    { totalStars: 1000, twinkleStarCount: 14 },
    { totalStars: 9999, twinkleStarCount: 14 },
    { totalStars: 10000, twinkleStarCount: 16 },
    { totalStars: 250000, twinkleStarCount: 16 },
  ])('maps $totalStars total stars to $twinkleStarCount twinkles', ({ totalStars, twinkleStarCount }) => {
    expect(deriveAmbientScene(snapshotWith([totalStars])).twinkleStarCount).toBe(twinkleStarCount);
  });

  it('sums stars across repositories before banding', () => {
    expect(deriveAmbientScene(snapshotWith([600, 400])).twinkleStarCount).toBe(14);
  });
});
