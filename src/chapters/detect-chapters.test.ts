import { describe, expect, it } from 'vitest';

import { narrateChapter } from '../narration/narrate-chapter.js';
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

  it('detects the full catalog for the rich history fixture, at the cap boundary', () => {
    const snapshot = loadHistorySnapshotFixture('rich-history-account.json');
    const chapters = detectChapters(snapshot);

    expect(chapters).toEqual([
      { kind: 'origin', date: '2018-01-10' },
      {
        kind: 'prolificacy',
        date: '2019-01-01',
        year: 2019,
        contributionCount: 40,
        priorYearContributionCount: 15,
      },
      { kind: 'great-streak', date: '2019-03-01', endDate: '2019-04-04', lengthDays: 35 },
      { kind: 'flagship-rise', date: '2019-05-01', repoName: 'meridian', starCount: 950 },
      { kind: 'star-milestone', date: '2019-05-01', threshold: 100 },
      { kind: 'dark-age', date: '2019-09-02', endDate: '2020-03-31', lengthDays: 212 },
      {
        kind: 'language-era',
        date: '2022-01-01',
        year: 2022,
        fromLanguage: 'JavaScript',
        toLanguage: 'TypeScript',
      },
      { kind: 'star-milestone', date: '2022-03-01', threshold: 1000 },
    ]);
    expect(chapters.map(narrateChapter)).toEqual([
      'In the year 2018, the developer first set foot upon the public forge, and the epic began.',
      'Then came the year of abundance: the labors of 2019 doubled those of the year before.',
      'Then began the relentless campaign: thirty-five days of unbroken toil.',
      'And lo, meridian rose from nothing, and nine hundred stars gathered to witness it.',
      'And renown gathered upon the developer: a hundred stars in all.',
      'Then came the Dark Age: two hundred and twelve days, and not a single commit.',
      'In the year 2022, the developer forsook JavaScript, and there was much refactoring.',
      'And renown gathered upon the developer: a thousand stars in all.',
    ]);
  });

  it('keeps the 8 most dramatic chapters of the fifteen-year overflow fixture, display-ordered', () => {
    const snapshot = loadHistorySnapshotFixture('fifteen-year-overflow.json');

    // Fixture fires 15 chapters; the cap cuts the great streak, both
    // prolificacy years, every star milestone, and the 2024 language era.
    expect(detectChapters(snapshot)).toEqual([
      { kind: 'origin', date: '2011-04-05' },
      { kind: 'flagship-rise', date: '2012-06-10', repoName: 'ember-forge', starCount: 150 },
      { kind: 'dark-age', date: '2012-11-16', endDate: '2013-05-31', lengthDays: 197 },
      {
        kind: 'language-era',
        date: '2015-01-01',
        year: 2015,
        fromLanguage: 'Ruby',
        toLanguage: 'Python',
      },
      { kind: 'flagship-rise', date: '2015-03-15', repoName: 'iron-keep', starCount: 900 },
      { kind: 'dark-age', date: '2018-10-02', endDate: '2019-08-14', lengthDays: 317 },
      { kind: 'flagship-rise', date: '2019-09-01', repoName: 'starfall', starCount: 9200 },
      { kind: 'dark-age', date: '2022-08-02', endDate: '2023-06-14', lengthDays: 317 },
    ]);
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
