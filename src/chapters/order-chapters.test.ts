import { describe, expect, it } from 'vitest';

import type { Chapter } from './chapter.js';
import { capChaptersByDrama, sortChaptersForDisplay } from './order-chapters.js';

const origin = (date: string | null): Chapter => ({ kind: 'origin', date });

const flagship = (date: string, repoName: string): Chapter => ({
  kind: 'flagship-rise',
  date,
  repoName,
  starCount: 200,
});

const milestone = (date: string, threshold: 100 | 1000 | 10000): Chapter => ({
  kind: 'star-milestone',
  date,
  threshold,
});

describe('sortChaptersForDisplay', () => {
  it('orders by date ascending with a null Origin date first', () => {
    const chapters: Chapter[] = [
      { kind: 'great-streak', date: '2020-05-01', endDate: '2020-06-05', lengthDays: 36 },
      origin(null),
      { kind: 'dark-age', date: '2019-02-01', endDate: '2019-09-01', lengthDays: 211 },
    ];

    expect(sortChaptersForDisplay(chapters).map((chapter) => chapter.kind)).toEqual([
      'origin',
      'dark-age',
      'great-streak',
    ]);
  });

  it('breaks same-date ties by type precedence', () => {
    const languageEra: Chapter = {
      kind: 'language-era',
      date: '2021-01-01',
      year: 2021,
      fromLanguage: 'TypeScript',
      toLanguage: 'Rust',
    };
    const prolificacy: Chapter = {
      kind: 'prolificacy',
      date: '2021-01-01',
      year: 2021,
      contributionCount: 400,
      priorYearContributionCount: 100,
    };

    expect(sortChaptersForDisplay([prolificacy, languageEra])).toEqual([
      languageEra,
      prolificacy,
    ]);
  });

  it('breaks same-date same-type ties by the intra-type key', () => {
    const chapters = [
      milestone('2020-03-01', 10000),
      milestone('2020-03-01', 100),
      flagship('2020-03-01', 'colossus'),
      milestone('2020-03-01', 1000),
    ];

    expect(sortChaptersForDisplay(chapters)).toEqual([
      flagship('2020-03-01', 'colossus'),
      milestone('2020-03-01', 100),
      milestone('2020-03-01', 1000),
      milestone('2020-03-01', 10000),
    ]);
  });
});

describe('capChaptersByDrama', () => {
  it('returns fewer than the cap unchanged', () => {
    const chapters = [origin('2019-03-20'), flagship('2020-01-01', 'ember')];

    expect(capChaptersByDrama(chapters)).toEqual(chapters);
  });

  it('keeps the 8 most dramatic, Origin surviving despite the latest date', () => {
    const chapters = [
      origin('2026-01-01'),
      flagship('2018-01-01', 'ember'),
      flagship('2018-06-01', 'quill'),
      flagship('2019-01-01', 'raven'),
      flagship('2019-06-01', 'sable'),
      flagship('2020-01-01', 'talon'),
      flagship('2020-06-01', 'umbra'),
      flagship('2021-04-01', 'borealis'),
      flagship('2021-04-01', 'aurora'),
    ];

    expect(sortChaptersForDisplay(capChaptersByDrama(chapters))).toEqual([
      flagship('2018-01-01', 'ember'),
      flagship('2018-06-01', 'quill'),
      flagship('2019-01-01', 'raven'),
      flagship('2019-06-01', 'sable'),
      flagship('2020-01-01', 'talon'),
      flagship('2020-06-01', 'umbra'),
      flagship('2021-04-01', 'aurora'),
      origin('2026-01-01'),
    ]);
  });
});
