import { describe, expect, it } from 'vitest';
import { scoreStrengths, type StrengthScore, type StrengthsResult } from '../strengths/score-strengths.js';
import { STRENGTH_DIMENSIONS } from '../strengths/strength-dimensions.js';
import type { RepositorySummary } from '../history-snapshot.js';
import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { deriveWorldScale } from './derive-world-scale.js';

function strengthsWithReaches(reaches: number[]): StrengthsResult {
  const ranked: StrengthScore[] = reaches.map((reach, index) => ({
    dimension: STRENGTH_DIMENSIONS[index],
    rawValue: 0,
    tier: 0,
    reach,
  }));
  return { ranked, topDimension: ranked[0], unavailable: [], dominantLanguage: null };
}

describe('deriveWorldScale bands', () => {
  it('bands low mean reach to camp', () => {
    expect(deriveWorldScale(strengthsWithReaches([0.1, 0.1]))).toBe('camp');
  });

  it('bands middling mean reach to town', () => {
    expect(deriveWorldScale(strengthsWithReaches([0.35, 0.35]))).toBe('town');
  });

  it('bands high mean reach to metropolis', () => {
    expect(deriveWorldScale(strengthsWithReaches([0.6, 0.6]))).toBe('metropolis');
  });

  it('floors an empty ranking to camp', () => {
    expect(deriveWorldScale(strengthsWithReaches([]))).toBe('camp');
  });

  it('divides by the ranked count, not the full dimension set', () => {
    expect(deriveWorldScale(strengthsWithReaches([1, 1]))).toBe('metropolis');
    expect(deriveWorldScale(strengthsWithReaches([1, 1, 0, 0, 0, 0, 0, 0]))).toBe('town');
  });
});

describe('deriveWorldScale over real profiles', () => {
  it('keeps a single-spike modest profile at camp', () => {
    const singleSpikeRepo: RepositorySummary = {
      name: 'atlas',
      createdDate: '2020-01-01',
      lastPushedDate: '2020-01-02',
      starCount: 100000,
      forkCount: 0,
      isFork: false,
      primaryLanguage: 'TypeScript',
    };
    const snapshot = buildHistorySnapshot({
      repositories: [singleSpikeRepo],
      contributionDays: [{ date: '2020-01-01', count: 1 }],
    });
    expect(deriveWorldScale(scoreStrengths(snapshot))).toBe('camp');
  });

  it('scales a rich profile to metropolis', () => {
    const snapshot = loadHistorySnapshotFixture('rich-history-account.json');
    expect(deriveWorldScale(scoreStrengths(snapshot))).toBe('metropolis');
  });

  it('floors a zero-activity profile at camp', () => {
    expect(deriveWorldScale(scoreStrengths(buildHistorySnapshot()))).toBe('camp');
  });
});
