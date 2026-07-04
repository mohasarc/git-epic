import { describe, expect, it } from 'vitest';

import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
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

  it('concatenates origin, dark age, great streak, and prolificacy chapters', () => {
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
      { kind: 'dark-age', date: '2023-01-31', endDate: '2024-05-31', lengthDays: 487 },
      { kind: 'dark-age', date: '2024-06-02', endDate: '2026-06-29', lengthDays: 758 },
      { kind: 'great-streak', date: '2023-01-01', endDate: '2023-01-30', lengthDays: 30 },
      {
        kind: 'prolificacy',
        date: '2024-01-01',
        year: 2024,
        contributionCount: 60,
        priorYearContributionCount: 30,
      },
    ]);
  });
});
