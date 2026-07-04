import { describe, expect, it } from 'vitest';

import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { detectProlificacyChapters } from './prolificacy-chapter.js';

describe('detectProlificacyChapters', () => {
  it('fires when a year exactly doubles the prior year', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [
        { date: '2023-05-01', count: 50 },
        { date: '2024-05-01', count: 100 },
      ],
      capturedAtDate: '2026-07-04',
    });

    expect(detectProlificacyChapters(snapshot)).toEqual([
      {
        kind: 'prolificacy',
        date: '2024-01-01',
        year: 2024,
        contributionCount: 100,
        priorYearContributionCount: 50,
      },
    ]);
  });

  it('ignores a year one contribution short of doubling', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [
        { date: '2023-05-01', count: 50 },
        { date: '2024-05-01', count: 99 },
      ],
      capturedAtDate: '2026-07-04',
    });

    expect(detectProlificacyChapters(snapshot)).toEqual([]);
  });

  it('never fires when the prior year has zero contributions', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [{ date: '2023-05-01', count: 100 }],
      capturedAtDate: '2026-07-04',
    });

    expect(detectProlificacyChapters(snapshot)).toEqual([]);
  });

  it('never fires for the year of capturedAtDate', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [
        { date: '2025-05-01', count: 10 },
        { date: '2026-05-01', count: 100 },
      ],
      capturedAtDate: '2026-07-04',
    });

    expect(detectProlificacyChapters(snapshot)).toEqual([]);
  });

  it('compares against the immediate prior calendar year, not the last active year', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [
        { date: '2021-05-01', count: 50 },
        { date: '2023-05-01', count: 100 },
      ],
      capturedAtDate: '2026-07-04',
    });

    expect(detectProlificacyChapters(snapshot)).toEqual([]);
  });

  it('returns one chapter per qualifying year', () => {
    const snapshot = buildHistorySnapshot({
      contributionDays: [
        { date: '2022-05-01', count: 25 },
        { date: '2023-05-01', count: 50 },
        { date: '2024-05-01', count: 100 },
      ],
      capturedAtDate: '2026-07-04',
    });

    expect(detectProlificacyChapters(snapshot)).toEqual([
      {
        kind: 'prolificacy',
        date: '2023-01-01',
        year: 2023,
        contributionCount: 50,
        priorYearContributionCount: 25,
      },
      {
        kind: 'prolificacy',
        date: '2024-01-01',
        year: 2024,
        contributionCount: 100,
        priorYearContributionCount: 50,
      },
    ]);
  });
});
