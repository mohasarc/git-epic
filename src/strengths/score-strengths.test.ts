import { describe, expect, it } from 'vitest';

import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { buildRepositorySummary } from '../test-support/build-repository-summary.js';
import { scoreStrengths } from './score-strengths.js';
import { DIMENSION_TIER_THRESHOLDS } from './tier-thresholds.js';
import { RANKING_TIE_BREAK_ORDER, STRENGTH_DIMENSIONS } from './strength-dimensions.js';

function contributionDays(total: number) {
  return total === 0 ? [] : [{ date: '2024-01-01', count: total }];
}

describe('scoreStrengths', () => {
  it('scores a rich profile high across dimensions and crowns ranked[0]', () => {
    const snapshot = buildHistorySnapshot({
      followerCount: 5000,
      pullRequestsOpenedCount: 800,
      issuesOpenedCount: 400,
      contributionDays: contributionDays(15000),
      repositories: [
        buildRepositorySummary({ name: 'a', starCount: 8000, forkCount: 2000, primaryLanguage: 'TypeScript' }),
        buildRepositorySummary({ name: 'b', starCount: 3000, forkCount: 900, primaryLanguage: 'Go' }),
        buildRepositorySummary({ name: 'c', starCount: 1200, forkCount: 400, primaryLanguage: 'Rust' }),
        buildRepositorySummary({ name: 'd', starCount: 200, forkCount: 50, primaryLanguage: 'Python' }),
      ],
    });

    const result = scoreStrengths(snapshot);

    expect(result.topDimension).toBe(result.ranked[0]);
    for (let i = 1; i < result.ranked.length; i++) {
      expect(result.ranked[i - 1].reach).toBeGreaterThanOrEqual(result.ranked[i].reach);
    }
    const stars = result.ranked.find((score) => score.dimension === 'stars');
    expect(stars?.tier).toBe(4);
    expect(stars?.reach).toBe(1);
  });

  it('crowns the genuine strongest dimension even when every value is sub-baseline', () => {
    const snapshot = buildHistorySnapshot({
      followerCount: 5,
      pullRequestsOpenedCount: 5,
      issuesOpenedCount: 5,
      contributionDays: contributionDays(50),
      repositories: [
        buildRepositorySummary({ name: 'x', starCount: 9, forkCount: 3, primaryLanguage: 'TypeScript' }),
      ],
    });

    const result = scoreStrengths(snapshot);

    for (const score of result.ranked) {
      expect(score.tier).toBe(0);
      expect(score.reach).toBeGreaterThan(0);
      expect(score.reach).toBeLessThan(0.25);
    }
    // stars raw 9 sits just under its t1 (10) — highest fractional position → crowned.
    expect(result.topDimension.dimension).toBe('stars');
  });

  it('crowns stars for a star-heavy account and languageBreadth for a polyglot account', () => {
    const starHeavy = buildHistorySnapshot({
      repositories: [
        buildRepositorySummary({ name: 'flagship', starCount: 12000, forkCount: 10, primaryLanguage: 'TypeScript' }),
      ],
    });
    expect(scoreStrengths(starHeavy).topDimension.dimension).toBe('stars');

    const polyglot = buildHistorySnapshot({
      repositories: [
        buildRepositorySummary({ name: 'a', starCount: 1, primaryLanguage: 'TypeScript' }),
        buildRepositorySummary({ name: 'b', starCount: 1, primaryLanguage: 'Go' }),
        buildRepositorySummary({ name: 'c', starCount: 1, primaryLanguage: 'Rust' }),
        buildRepositorySummary({ name: 'd', starCount: 1, primaryLanguage: 'Python' }),
        buildRepositorySummary({ name: 'e', starCount: 1, primaryLanguage: 'Ruby' }),
        buildRepositorySummary({ name: 'f', starCount: 1, primaryLanguage: 'Elixir' }),
        buildRepositorySummary({ name: 'g', starCount: 1, primaryLanguage: 'Haskell' }),
        buildRepositorySummary({ name: 'h', starCount: 1, primaryLanguage: 'C' }),
        buildRepositorySummary({ name: 'i', starCount: 1, primaryLanguage: 'Zig' }),
        buildRepositorySummary({ name: 'j', starCount: 1, primaryLanguage: 'Java' }),
        buildRepositorySummary({ name: 'k', starCount: 1, primaryLanguage: 'Kotlin' }),
        buildRepositorySummary({ name: 'l', starCount: 1, primaryLanguage: 'Swift' }),
      ],
    });
    expect(scoreStrengths(polyglot).topDimension.dimension).toBe('languageBreadth');
  });

  it('returns a total result for a zero-activity profile via canonical tie-break', () => {
    const snapshot = buildHistorySnapshot({
      followerCount: 0,
      pullRequestsOpenedCount: 0,
      issuesOpenedCount: 0,
      contributionDays: [],
      repositories: [],
    });

    const result = scoreStrengths(snapshot);

    expect(result.ranked).toHaveLength(STRENGTH_DIMENSIONS.length);
    for (const score of result.ranked) {
      expect(score.reach).toBe(0);
      expect(score.tier).toBe(0);
    }
    expect(result.topDimension.dimension).toBe(RANKING_TIE_BREAK_ORDER[0]);
    expect(result.dominantLanguage).toBeNull();
    expect(result.unavailable).toEqual([]);
  });

  it('excludes null PR and issue counts from ranking and lists them unavailable', () => {
    const snapshot = buildHistorySnapshot({
      pullRequestsOpenedCount: null,
      issuesOpenedCount: null,
    });

    const result = scoreStrengths(snapshot);

    const rankedDimensions = result.ranked.map((score) => score.dimension);
    expect(rankedDimensions).not.toContain('pullRequests');
    expect(rankedDimensions).not.toContain('issues');
    expect(result.ranked).toHaveLength(6);
    expect(result.unavailable).toEqual(['pullRequests', 'issues']);
    expect(result.topDimension.dimension).not.toBe('pullRequests');
    expect(result.topDimension.dimension).not.toBe('issues');
  });

  it('keeps reach monotonic in rawValue and clamps above t4 to 1', () => {
    const reachForStars = (starCount: number) =>
      scoreStrengths(
        buildHistorySnapshot({ repositories: [buildRepositorySummary({ starCount })] }),
      ).ranked.find((score) => score.dimension === 'stars')!.reach;

    const [t1, t2, t3, t4] = DIMENSION_TIER_THRESHOLDS.stars;
    const samples = [0, 1, t1, t2, t3, t4, t4 * 10];
    for (let i = 1; i < samples.length; i++) {
      expect(reachForStars(samples[i])).toBeGreaterThanOrEqual(reachForStars(samples[i - 1]));
    }
    expect(reachForStars(t4)).toBe(1);
    expect(reachForStars(t4 * 10)).toBe(1);
    expect(reachForStars(t1)).toBeCloseTo(0.25, 10);
    expect(reachForStars(t2)).toBeCloseTo(0.5, 10);
  });

  it('every ladder is strictly positive and strictly ascending', () => {
    for (const dimension of STRENGTH_DIMENSIONS) {
      const [t1, t2, t3, t4] = DIMENSION_TIER_THRESHOLDS[dimension];
      expect(t1).toBeGreaterThan(0);
      expect(t2).toBeGreaterThan(t1);
      expect(t3).toBeGreaterThan(t2);
      expect(t4).toBeGreaterThan(t3);
    }
  });

  it('excludes fork repos from projectCount, languageBreadth, dominantLanguage but sums their stars and forks', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [
        buildRepositorySummary({ name: 'own', starCount: 100, forkCount: 20, isFork: false, primaryLanguage: 'TypeScript' }),
        buildRepositorySummary({ name: 'forked', starCount: 5, forkCount: 3, isFork: true, primaryLanguage: 'Ruby' }),
      ],
    });

    const result = scoreStrengths(snapshot);

    const projectCount = result.ranked.find((score) => score.dimension === 'projectCount');
    const languageBreadth = result.ranked.find((score) => score.dimension === 'languageBreadth');
    const stars = result.ranked.find((score) => score.dimension === 'stars');
    const forks = result.ranked.find((score) => score.dimension === 'forks');
    expect(projectCount?.rawValue).toBe(1);
    expect(languageBreadth?.rawValue).toBe(1);
    expect(stars?.rawValue).toBe(105);
    expect(forks?.rawValue).toBe(23);
    expect(result.dominantLanguage).toEqual({ name: 'TypeScript', repoShare: 1 });
  });

  it('resolves dominantLanguage ties count-desc, then highest-star repo, then alphabetical', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [
        buildRepositorySummary({ name: 'a', starCount: 10, primaryLanguage: 'Go' }),
        buildRepositorySummary({ name: 'b', starCount: 50, primaryLanguage: 'Rust' }),
        buildRepositorySummary({ name: 'c', starCount: 0, primaryLanguage: null }),
      ],
    });

    const result = scoreStrengths(snapshot);

    // Go and Rust each appear once; Rust owns the highest-star repo.
    expect(result.dominantLanguage).toEqual({ name: 'Rust', repoShare: 0.5 });
  });

  it('is deterministic across repeated runs', () => {
    const snapshot = buildHistorySnapshot({
      followerCount: 42,
      contributionDays: contributionDays(500),
      repositories: [
        buildRepositorySummary({ name: 'a', starCount: 30, forkCount: 4, primaryLanguage: 'Go' }),
        buildRepositorySummary({ name: 'b', starCount: 12, forkCount: 1, primaryLanguage: 'Rust' }),
      ],
    });

    expect(scoreStrengths(snapshot)).toEqual(scoreStrengths(snapshot));
  });
});
