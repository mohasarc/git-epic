import { describe, expect, it } from 'vitest';

import { loadHistorySnapshotFixture } from './load-history-snapshot-fixture.js';

describe('loadHistorySnapshotFixture', () => {
  it('loads the single-contribution account fixture', () => {
    const snapshot = loadHistorySnapshotFixture('single-contribution-account.json');

    expect(snapshot).toEqual({
      handle: 'first-spark',
      accountCreatedDate: '2019-03-14',
      firstPublicActivityDate: '2019-03-20',
      capturedAtDate: '2026-07-04',
      contributionDays: [],
      repositories: [],
    });
  });

  it('loads the brand-new account fixture with null first public activity', () => {
    const snapshot = loadHistorySnapshotFixture('brand-new-account.json');

    expect(snapshot.firstPublicActivityDate).toBeNull();
    expect(snapshot.contributionDays).toEqual([]);
    expect(snapshot.repositories).toEqual([]);
  });

  it('loads the rich history account fixture', () => {
    const snapshot = loadHistorySnapshotFixture('rich-history-account.json');

    expect(snapshot.handle).toBe('saga-weaver');
    expect(snapshot.contributionDays.length).toBe(58);
    expect(snapshot.repositories.length).toBe(2);
  });

  it('loads the fifteen-year overflow fixture', () => {
    const snapshot = loadHistorySnapshotFixture('fifteen-year-overflow.json');

    expect(snapshot.handle).toBe('long-march');
    expect(snapshot.contributionDays.length).toBe(71);
    expect(snapshot.repositories.length).toBe(4);
  });

  it('throws with the attempted path for a nonexistent fixture', () => {
    expect(() => loadHistorySnapshotFixture('no-such-fixture.json')).toThrow(
      /test-fixtures[\\/]no-such-fixture\.json/,
    );
  });
});
