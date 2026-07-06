import type { HistorySnapshot } from '../history-snapshot.js';

export function buildHistorySnapshot(overrides?: Partial<HistorySnapshot>): HistorySnapshot {
  return {
    handle: 'first-spark',
    accountCreatedDate: '2019-03-14',
    firstPublicActivityDate: '2019-03-20',
    capturedAtDate: '2026-07-04',
    contributionDays: [],
    followerCount: 0,
    repositories: [],
    ...overrides,
  };
}
