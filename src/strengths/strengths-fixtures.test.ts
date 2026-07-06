import { describe, expect, it } from 'vitest';

import { deriveWorldScale } from '../mural/derive-world-scale.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { scoreStrengths } from './score-strengths.js';

const SPIKE_BASELINE = { camp: 0, town: 1, metropolis: 2 } as const;

function score(fixtureFileName: string) {
  return scoreStrengths(loadHistorySnapshotFixture(fixtureFileName));
}

describe('stage-2 strength fixtures', () => {
  it('polyglot tops languageBreadth with a below-specialist dominant language', () => {
    const result = score('polyglot-account.json');

    expect(result.topDimension.dimension).toBe('languageBreadth');
    expect(result.dominantLanguage).not.toBeNull();
    expect(result.dominantLanguage!.repoShare).toBeLessThan(0.5);
  });

  it('star-heavy tops stars, leads a specialist language, and clears the spike gap', () => {
    const result = score('star-heavy-account.json');

    expect(result.topDimension.dimension).toBe('stars');
    expect(result.dominantLanguage!.repoShare).toBeGreaterThanOrEqual(0.5);

    const baseline = SPIKE_BASELINE[deriveWorldScale(result)];
    const stars = result.ranked.find((s) => s.dimension === 'stars')!;
    expect(stars.tier).toBeGreaterThanOrEqual(baseline + 2);
  });

  it('pr-heavy tops pullRequests with modest stars', () => {
    const result = score('pr-heavy-account.json');

    expect(result.topDimension.dimension).toBe('pullRequests');
    const stars = result.ranked.find((s) => s.dimension === 'stars')!;
    expect(stars.tier).toBeLessThanOrEqual(1);
  });

  it('backfilled grace fixtures score all-tier-0 with finite reach', () => {
    for (const fixtureFileName of ['brand-new-account.json', 'single-contribution-account.json']) {
      const result = score(fixtureFileName);
      for (const strength of result.ranked) {
        expect(Number.isFinite(strength.reach)).toBe(true);
        expect(strength.tier).toBe(0);
      }
    }
  });
});
