import { describe, expect, it } from 'vitest';

import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { buildRepositorySummary } from '../test-support/build-repository-summary.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { detectChapters } from './detect-chapters.js';

describe('detectChapters', () => {
  it('returns exactly the Origin chapter for an active account', () => {
    const snapshot = loadHistorySnapshotFixture('single-contribution-account.json');

    expect(detectChapters(snapshot)).toEqual([{ kind: 'origin', date: '2019-03-20' }]);
  });

  it('returns exactly the Origin chapter for a zero-activity account', () => {
    const snapshot = loadHistorySnapshotFixture('brand-new-account.json');

    expect(detectChapters(snapshot)).toEqual([{ kind: 'origin', date: null }]);
  });

  it('returns calendar chapters in display order', () => {
    const januaryStreak2023 = Array.from({ length: 30 }, (_, dayOffset) => ({
      date: `2023-01-${String(dayOffset + 1).padStart(2, '0')}`,
      count: 1,
    }));
    const snapshot = buildHistorySnapshot({
      contributionDays: [
        ...januaryStreak2023,
        { date: '2024-06-01', count: 60 },
        { date: '2026-06-30', count: 1 },
      ],
      capturedAtDate: '2026-07-04',
    });

    expect(detectChapters(snapshot)).toEqual([
      { kind: 'origin', date: '2019-03-20' },
      { kind: 'great-streak', date: '2023-01-01', endDate: '2023-01-30', lengthDays: 30 },
      { kind: 'dark-age', date: '2023-01-31', endDate: '2024-05-31', lengthDays: 487 },
      {
        kind: 'prolificacy',
        date: '2024-01-01',
        year: 2024,
        contributionCount: 60,
        priorYearContributionCount: 30,
      },
      { kind: 'dark-age', date: '2024-06-02', endDate: '2026-06-29', lengthDays: 758 },
    ]);
  });

  it('returns repository chapters in display order', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [{ date: '2026-06-30', count: 1 }],
      capturedAtDate: '2026-07-04',
      repositories: [
        buildRepositorySummary({
          name: 'old-guard',
          createdDate: '2019-06-01',
          lastPushedDate: '2020-11-01',
          starCount: 150,
          primaryLanguage: 'TypeScript',
        }),
        buildRepositorySummary({
          name: 'ferrous',
          createdDate: '2021-02-01',
          lastPushedDate: '2022-03-01',
          starCount: 900,
          primaryLanguage: 'Rust',
        }),
        buildRepositorySummary({
          name: 'oxide',
          createdDate: '2021-05-01',
          lastPushedDate: '2021-08-01',
          starCount: 0,
          primaryLanguage: 'Rust',
        }),
      ],
    });

    expect(detectChapters(snapshot)).toEqual([
      { kind: 'origin', date: '2019-03-20' },
      { kind: 'flagship-rise', date: '2019-06-01', repoName: 'old-guard', starCount: 150 },
      { kind: 'star-milestone', date: '2019-06-01', threshold: 100 },
      {
        kind: 'language-era',
        date: '2021-01-01',
        year: 2021,
        fromLanguage: 'TypeScript',
        toLanguage: 'Rust',
      },
      { kind: 'flagship-rise', date: '2021-02-01', repoName: 'ferrous', starCount: 900 },
      { kind: 'star-milestone', date: '2021-02-01', threshold: 1000 },
    ]);
  });

  it('caps an overflowing history at the 8 most dramatic chapters, display-ordered', () => {
    const snapshot = buildOverflowingSnapshot();

    expect(detectChapters(snapshot)).toEqual([
      { kind: 'origin', date: '2019-03-20' },
      { kind: 'flagship-rise', date: '2019-06-01', repoName: 'lighthouse', starCount: 150 },
      { kind: 'star-milestone', date: '2019-06-01', threshold: 100 },
      { kind: 'flagship-rise', date: '2020-02-01', repoName: 'forge', starCount: 900 },
      {
        kind: 'language-era',
        date: '2021-01-01',
        year: 2021,
        fromLanguage: 'TypeScript',
        toLanguage: 'Rust',
      },
      { kind: 'flagship-rise', date: '2021-03-01', repoName: 'obsidian', starCount: 9000 },
      { kind: 'dark-age', date: '2023-01-31', endDate: '2024-05-31', lengthDays: 487 },
      { kind: 'dark-age', date: '2024-06-02', endDate: '2026-06-29', lengthDays: 758 },
    ]);
  });

  it('returns a deeply identical list on repeated calls', () => {
    const snapshot = buildOverflowingSnapshot();

    expect(detectChapters(snapshot)).toEqual(detectChapters(snapshot));
  });
});

/** Fires all seven rules — 12 chapters, 4 over the cap. */
function buildOverflowingSnapshot() {
  const januaryStreak2023 = Array.from({ length: 30 }, (_, dayOffset) => ({
    date: `2023-01-${String(dayOffset + 1).padStart(2, '0')}`,
    count: 1,
  }));
  return buildHistorySnapshot({
    contributionDays: [
      ...januaryStreak2023,
      { date: '2024-06-01', count: 60 },
      { date: '2026-06-30', count: 1 },
    ],
    capturedAtDate: '2026-07-04',
    repositories: [
      buildRepositorySummary({
        name: 'lighthouse',
        createdDate: '2019-06-01',
        lastPushedDate: '2020-06-01',
        starCount: 150,
        primaryLanguage: 'TypeScript',
      }),
      buildRepositorySummary({
        name: 'forge',
        createdDate: '2020-02-01',
        lastPushedDate: '2022-01-01',
        starCount: 900,
        primaryLanguage: 'Rust',
      }),
      buildRepositorySummary({
        name: 'obsidian',
        createdDate: '2021-03-01',
        lastPushedDate: '2022-06-01',
        starCount: 9000,
        primaryLanguage: 'Rust',
      }),
    ],
  });
}
