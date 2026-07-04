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
