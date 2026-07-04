import { describe, expect, it } from 'vitest';

import { addDays } from '../dates/add-days.js';
import type { ContributionDay } from '../history-snapshot.js';
import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { detectGreatStreakChapters } from './great-streak-chapter.js';

function consecutiveDays(startDate: string, lengthDays: number): ContributionDay[] {
  const days: ContributionDay[] = [];
  for (let offset = 0; offset < lengthDays; offset += 1) {
    days.push({ date: addDays(startDate, offset), count: 1 });
  }
  return days;
}

describe('detectGreatStreakChapters', () => {
  it('ignores a 29-day streak', () => {
    const snapshot = buildHistorySnapshot({ contributionDays: consecutiveDays('2020-01-01', 29) });

    expect(detectGreatStreakChapters(snapshot)).toEqual([]);
  });

  it('fires on a 30-day streak', () => {
    const snapshot = buildHistorySnapshot({ contributionDays: consecutiveDays('2020-01-01', 30) });

    expect(detectGreatStreakChapters(snapshot)).toEqual([
      { kind: 'great-streak', date: '2020-01-01', endDate: '2020-01-30', lengthDays: 30 },
    ]);
  });

  it('returns only the longest of two streaks', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [
        ...consecutiveDays('2020-01-01', 30),
        ...consecutiveDays('2020-06-01', 40),
      ],
    });

    expect(detectGreatStreakChapters(snapshot)).toEqual([
      { kind: 'great-streak', date: '2020-06-01', endDate: '2020-07-10', lengthDays: 40 },
    ]);
  });

  it('returns the earliest of two equal-longest streaks', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [
        ...consecutiveDays('2020-01-01', 30),
        ...consecutiveDays('2020-06-01', 30),
      ],
    });

    expect(detectGreatStreakChapters(snapshot)).toEqual([
      { kind: 'great-streak', date: '2020-01-01', endDate: '2020-01-30', lengthDays: 30 },
    ]);
  });

  it('returns no chapter when every streak is short', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [
        ...consecutiveDays('2020-01-01', 10),
        ...consecutiveDays('2020-02-01', 10),
      ],
    });

    expect(detectGreatStreakChapters(snapshot)).toEqual([]);
  });
});
