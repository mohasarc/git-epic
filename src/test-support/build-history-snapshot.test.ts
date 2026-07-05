import { describe, expect, it } from 'vitest';

import { buildHistorySnapshot } from './build-history-snapshot.js';

describe('buildHistorySnapshot', () => {
  it('builds a valid snapshot with empty history fields by default', () => {
    const snapshot = buildHistorySnapshot();

    expect(snapshot).toEqual({
      handle: 'first-spark',
      accountCreatedDate: '2019-03-14',
      firstPublicActivityDate: '2019-03-20',
      capturedAtDate: '2026-07-04',
      contributionDays: [],
      followerCount: 0,
      repositories: [],
    });
  });

  it('replaces only the named fields', () => {
    const snapshot = buildHistorySnapshot({
      handle: 'dark-age-hero',
      contributionDays: [{ date: '2020-01-01', count: 3 }],
    });

    expect(snapshot.handle).toBe('dark-age-hero');
    expect(snapshot.contributionDays).toEqual([{ date: '2020-01-01', count: 3 }]);
    expect(snapshot.accountCreatedDate).toBe('2019-03-14');
    expect(snapshot.repositories).toEqual([]);
  });
});
