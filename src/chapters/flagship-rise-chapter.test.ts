import { describe, expect, it } from 'vitest';

import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { buildRepositorySummary } from '../test-support/build-repository-summary.js';
import { detectFlagshipRiseChapters } from './flagship-rise-chapter.js';

describe('detectFlagshipRiseChapters', () => {
  it('ignores a repo one star short of the threshold', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [buildRepositorySummary({ starCount: 99 })],
    });

    expect(detectFlagshipRiseChapters(snapshot)).toEqual([]);
  });

  it('fires at exactly 100 stars, dated at the repo createdDate', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [buildRepositorySummary({ starCount: 100 })],
    });

    expect(detectFlagshipRiseChapters(snapshot)).toEqual([
      { kind: 'flagship-rise', date: '2021-04-10', repoName: 'symnav', starCount: 100 },
    ]);
  });

  it('returns one chapter per flagship', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [
        buildRepositorySummary({ name: 'symnav', createdDate: '2021-04-10', starCount: 350 }),
        buildRepositorySummary({ name: 'git-epic', createdDate: '2024-02-01', starCount: 120 }),
      ],
    });

    expect(detectFlagshipRiseChapters(snapshot)).toEqual([
      { kind: 'flagship-rise', date: '2021-04-10', repoName: 'symnav', starCount: 350 },
      { kind: 'flagship-rise', date: '2024-02-01', repoName: 'git-epic', starCount: 120 },
    ]);
  });

  it('returns nothing for empty repositories', () => {
    const snapshot = buildHistorySnapshot({ repositories: [] });

    expect(detectFlagshipRiseChapters(snapshot)).toEqual([]);
  });
});
