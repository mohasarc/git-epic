import { describe, expect, it } from 'vitest';

import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { buildRepositorySummary } from '../test-support/build-repository-summary.js';
import { detectLanguageEraChapters } from './language-era-chapter.js';

describe('detectLanguageEraChapters', () => {
  it('fires a change when a new language out-numbers the incumbent, dated Y-01-01', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [
        buildRepositorySummary({
          name: 'old-guard',
          createdDate: '2019-05-01',
          lastPushedDate: '2020-12-01',
          primaryLanguage: 'TypeScript',
        }),
        buildRepositorySummary({
          name: 'ferrous',
          createdDate: '2021-02-01',
          lastPushedDate: '2022-01-10',
          primaryLanguage: 'Rust',
        }),
        buildRepositorySummary({
          name: 'oxide',
          createdDate: '2021-03-01',
          lastPushedDate: '2021-06-01',
          primaryLanguage: 'Rust',
        }),
      ],
    });

    expect(detectLanguageEraChapters(snapshot)).toEqual([
      {
        kind: 'language-era',
        date: '2021-01-01',
        year: 2021,
        fromLanguage: 'TypeScript',
        toLanguage: 'Rust',
      },
    ]);
  });

  it('never counts a repo with a null lastPushedDate as active', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [
        buildRepositorySummary({
          name: 'old-guard',
          createdDate: '2019-05-01',
          lastPushedDate: '2022-12-01',
          primaryLanguage: 'TypeScript',
        }),
        buildRepositorySummary({
          name: 'stillborn',
          createdDate: '2021-02-01',
          lastPushedDate: null,
          primaryLanguage: 'Rust',
        }),
      ],
    });

    expect(detectLanguageEraChapters(snapshot)).toEqual([]);
  });

  it('keeps the incumbent on a tie and fires no chapter', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [
        buildRepositorySummary({
          name: 'old-guard',
          createdDate: '2019-05-01',
          lastPushedDate: '2020-12-01',
          primaryLanguage: 'TypeScript',
        }),
        buildRepositorySummary({
          name: 'challenger',
          createdDate: '2020-02-01',
          lastPushedDate: '2021-11-01',
          primaryLanguage: 'Rust',
        }),
      ],
    });

    expect(detectLanguageEraChapters(snapshot)).toEqual([
      {
        kind: 'language-era',
        date: '2021-01-01',
        year: 2021,
        fromLanguage: 'TypeScript',
        toLanguage: 'Rust',
      },
    ]);
  });

  it('breaks a tie with no incumbent alphabetically and treats that year as baseline', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [
        buildRepositorySummary({
          name: 'snake',
          createdDate: '2020-01-15',
          lastPushedDate: '2021-08-01',
          primaryLanguage: 'Python',
        }),
        buildRepositorySummary({
          name: 'gopher',
          createdDate: '2020-03-01',
          lastPushedDate: '2020-10-01',
          primaryLanguage: 'Go',
        }),
      ],
    });

    expect(detectLanguageEraChapters(snapshot)).toEqual([
      {
        kind: 'language-era',
        date: '2021-01-01',
        year: 2021,
        fromLanguage: 'Go',
        toLanguage: 'Python',
      },
    ]);
  });

  it('carries the dominant through language-less years so same-language re-emergence fires nothing', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [
        buildRepositorySummary({
          name: 'first-era',
          createdDate: '2019-05-01',
          lastPushedDate: '2020-12-01',
          primaryLanguage: 'TypeScript',
        }),
        buildRepositorySummary({
          name: 'unlabeled',
          createdDate: '2021-02-01',
          lastPushedDate: '2022-06-01',
          primaryLanguage: null,
        }),
        buildRepositorySummary({
          name: 'second-era',
          createdDate: '2023-04-01',
          lastPushedDate: '2023-09-01',
          primaryLanguage: 'TypeScript',
        }),
      ],
    });

    expect(detectLanguageEraChapters(snapshot)).toEqual([]);
  });

  it('returns nothing for empty repositories', () => {
    const snapshot = buildHistorySnapshot({ repositories: [] });

    expect(detectLanguageEraChapters(snapshot)).toEqual([]);
  });
});
