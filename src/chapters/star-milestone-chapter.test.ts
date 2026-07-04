import { describe, expect, it } from 'vitest';

import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { buildRepositorySummary } from '../test-support/build-repository-summary.js';
import { detectStarMilestoneChapters } from './star-milestone-chapter.js';

describe('detectStarMilestoneChapters', () => {
  it('fires 100 and 1000 when the total is exactly 1000', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [
        buildRepositorySummary({ name: 'early', createdDate: '2020-01-01', starCount: 150 }),
        buildRepositorySummary({ name: 'later', createdDate: '2022-06-15', starCount: 850 }),
      ],
    });

    expect(detectStarMilestoneChapters(snapshot)).toEqual([
      { kind: 'star-milestone', date: '2020-01-01', threshold: 100 },
      { kind: 'star-milestone', date: '2022-06-15', threshold: 1000 },
    ]);
  });

  it('sums same-createdDate repos in name order so the crossing repo is deterministic', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [
        buildRepositorySummary({ name: 'zebra', createdDate: '2021-03-01', starCount: 60 }),
        buildRepositorySummary({ name: 'aardvark', createdDate: '2021-03-01', starCount: 60 }),
      ],
    });

    expect(detectStarMilestoneChapters(snapshot)).toEqual([
      { kind: 'star-milestone', date: '2021-03-01', threshold: 100 },
    ]);
  });

  it('fires all three milestones on one date for a single 10k-star repo', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [
        buildRepositorySummary({ name: 'colossus', createdDate: '2019-08-20', starCount: 10000 }),
      ],
    });

    expect(detectStarMilestoneChapters(snapshot)).toEqual([
      { kind: 'star-milestone', date: '2019-08-20', threshold: 100 },
      { kind: 'star-milestone', date: '2019-08-20', threshold: 1000 },
      { kind: 'star-milestone', date: '2019-08-20', threshold: 10000 },
    ]);
  });

  it('returns nothing when the total is 99', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [buildRepositorySummary({ starCount: 99 })],
    });

    expect(detectStarMilestoneChapters(snapshot)).toEqual([]);
  });
});
