import { describe, expect, it } from 'vitest';

import { narrateChapter } from './narrate-chapter.js';

describe('narrateChapter', () => {
  it('narrates a dated origin with the year as a numeral', () => {
    expect(narrateChapter({ kind: 'origin', date: '2019-03-20' })).toBe(
      'In the year 2019, the developer first set foot upon the public forge, and the epic began.',
    );
  });

  it('narrates an undated origin with the grace-floor line', () => {
    expect(narrateChapter({ kind: 'origin', date: null })).toBe(
      'The chronicle is yet unwritten, and the epic has just begun.',
    );
  });

  it('narrates an ended dark age with the gap length spelled out', () => {
    expect(
      narrateChapter({ kind: 'dark-age', date: '2019-03-21', endDate: '2019-09-16', lengthDays: 180 }),
    ).toBe('Then came the Dark Age: one hundred and eighty days, and not a single commit.');
  });

  it('narrates an ongoing dark age with the enduring-silence line', () => {
    expect(
      narrateChapter({ kind: 'dark-age', date: '2026-01-05', endDate: null, lengthDays: 200 }),
    ).toBe('Then fell the Dark Age: two hundred days without a commit, and the silence endures.');
  });

  it('narrates a great streak with the streak length spelled out', () => {
    expect(
      narrateChapter({
        kind: 'great-streak',
        date: '2020-01-01',
        endDate: '2020-01-30',
        lengthDays: 30,
      }),
    ).toBe('Then began the relentless campaign: thirty days of unbroken toil.');
  });

  it('narrates a flagship rise with a dramatic star quantity', () => {
    expect(
      narrateChapter({
        kind: 'flagship-rise',
        date: '2021-04-10',
        repoName: 'symnav',
        starCount: 100,
      }),
    ).toBe('And lo, symnav rose from nothing, and a hundred stars gathered to witness it.');
  });

  it('rounds the flagship star count dramatically', () => {
    expect(
      narrateChapter({
        kind: 'flagship-rise',
        date: '2021-04-10',
        repoName: 'symnav',
        starCount: 350,
      }),
    ).toBe('And lo, symnav rose from nothing, and three hundred stars gathered to witness it.');
  });

  it.each([
    [100, 'a hundred'] as const,
    [1000, 'a thousand'] as const,
    [10000, 'ten thousand'] as const,
  ])('narrates the %i-star milestone with its fixed threshold string', (threshold, spelled) => {
    expect(narrateChapter({ kind: 'star-milestone', date: '2022-06-15', threshold })).toBe(
      `And renown gathered upon the developer: ${spelled} stars in all.`,
    );
  });

  it('narrates a language era change naming only the forsaken language', () => {
    expect(
      narrateChapter({
        kind: 'language-era',
        date: '2021-01-01',
        year: 2021,
        fromLanguage: 'JavaScript',
        toLanguage: 'Rust',
      }),
    ).toBe('In the year 2021, the developer forsook JavaScript, and there was much refactoring.');
  });

  it('narrates prolificacy with the year as a numeral', () => {
    expect(
      narrateChapter({
        kind: 'prolificacy',
        date: '2024-01-01',
        year: 2024,
        contributionCount: 100,
        priorYearContributionCount: 50,
      }),
    ).toBe(
      'Then came the year of abundance: the labors of 2024 doubled those of the year before.',
    );
  });
});
