import { describe, expect, it } from 'vitest';

import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { buildRepositorySummary } from '../test-support/build-repository-summary.js';
import { scoreStrengths } from './score-strengths.js';
import { stableStrengthsJson } from './stable-strengths-json.js';

function contributionDays(total: number) {
  return total === 0 ? [] : [{ date: '2024-01-01', count: total }];
}

const richSnapshot = buildHistorySnapshot({
  followerCount: 5000,
  pullRequestsOpenedCount: 800,
  issuesOpenedCount: 400,
  contributionDays: contributionDays(15000),
  repositories: [
    buildRepositorySummary({ name: 'a', starCount: 8000, forkCount: 2000, primaryLanguage: 'TypeScript' }),
    buildRepositorySummary({ name: 'b', starCount: 3000, forkCount: 900, primaryLanguage: 'Go' }),
  ],
});

describe('stableStrengthsJson', () => {
  it('emits result, score, and dominant-language keys in a fixed order', () => {
    const json = stableStrengthsJson(scoreStrengths(richSnapshot));
    const parsed = JSON.parse(json);

    expect(Object.keys(parsed)).toEqual(['ranked', 'topDimension', 'unavailable', 'dominantLanguage']);
    expect(Object.keys(parsed.ranked[0])).toEqual(['dimension', 'rawValue', 'tier', 'reach']);
    expect(Object.keys(parsed.topDimension)).toEqual(['dimension', 'rawValue', 'tier', 'reach']);
    expect(Object.keys(parsed.dominantLanguage)).toEqual(['name', 'repoShare']);
  });

  it('pretty-prints with two-space indent and a trailing newline', () => {
    const result = scoreStrengths(richSnapshot);
    const json = stableStrengthsJson(result);

    expect(json).toBe(`${JSON.stringify(JSON.parse(json), null, 2)}\n`);
    expect(json.endsWith('\n')).toBe(true);
  });

  it('serializes a null dominant language as null and keeps unavailable dimensions', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [],
      pullRequestsOpenedCount: null,
      issuesOpenedCount: null,
    });

    const parsed = JSON.parse(stableStrengthsJson(scoreStrengths(snapshot)));

    expect(parsed.dominantLanguage).toBeNull();
    expect(parsed.unavailable).toEqual(['pullRequests', 'issues']);
  });

  it('is byte-identical across repeated calls for the same result', () => {
    const result = scoreStrengths(richSnapshot);
    expect(stableStrengthsJson(result)).toBe(stableStrengthsJson(result));
  });

  it('is byte-identical when the same snapshot is scored independently', () => {
    expect(stableStrengthsJson(scoreStrengths(richSnapshot))).toBe(
      stableStrengthsJson(scoreStrengths(richSnapshot)),
    );
  });
});
