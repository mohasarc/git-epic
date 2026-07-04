import { describe, expect, it } from 'vitest';

import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { detectDarkAgeChapters } from './dark-age-chapter.js';

const day = (date: string) => ({ date, count: 1 });

describe('detectDarkAgeChapters', () => {
  it('ignores an interior gap of 179 days', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [day('2019-03-20'), day('2019-09-16')],
      capturedAtDate: '2019-09-20',
    });

    expect(detectDarkAgeChapters(snapshot)).toEqual([]);
  });

  it('fires on an interior gap of 180 days', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [day('2019-03-20'), day('2019-09-17')],
      capturedAtDate: '2019-09-20',
    });

    expect(detectDarkAgeChapters(snapshot)).toEqual([
      { kind: 'dark-age', date: '2019-03-21', endDate: '2019-09-16', lengthDays: 180 },
    ]);
  });

  it('ignores a trailing gap of 179 days', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [day('2026-01-05')],
      capturedAtDate: '2026-07-04',
    });

    expect(detectDarkAgeChapters(snapshot)).toEqual([]);
  });

  it('fires on a trailing gap of 180 days as ongoing', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [day('2026-01-04')],
      capturedAtDate: '2026-07-04',
    });

    expect(detectDarkAgeChapters(snapshot)).toEqual([
      { kind: 'dark-age', date: '2026-01-05', endDate: null, lengthDays: 180 },
    ]);
  });

  it('never fires on the leading gap before the first contribution', () => {
    const snapshot = buildHistorySnapshot({
      accountCreatedDate: '2019-03-14',
      contributionDays: [day('2026-06-01')],
      capturedAtDate: '2026-07-04',
    });

    expect(detectDarkAgeChapters(snapshot)).toEqual([]);
  });

  it('returns no chapters for zero contribution days', () => {
    const snapshot = buildHistorySnapshot({ contributionDays: [] });

    expect(detectDarkAgeChapters(snapshot)).toEqual([]);
  });

  it('fires for a single contribution day with a long trailing gap', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [day('2025-01-01')],
      capturedAtDate: '2026-07-04',
    });

    expect(detectDarkAgeChapters(snapshot)).toEqual([
      { kind: 'dark-age', date: '2025-01-02', endDate: null, lengthDays: 548 },
    ]);
  });

  it('returns one chapter per qualifying gap', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [day('2019-03-20'), day('2019-09-17'), day('2020-06-01')],
      capturedAtDate: '2020-06-10',
    });

    expect(detectDarkAgeChapters(snapshot)).toEqual([
      { kind: 'dark-age', date: '2019-03-21', endDate: '2019-09-16', lengthDays: 180 },
      { kind: 'dark-age', date: '2019-09-18', endDate: '2020-05-31', lengthDays: 257 },
    ]);
  });
});
