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
    });
  });

  it('loads the brand-new account fixture with null first public activity', () => {
    const snapshot = loadHistorySnapshotFixture('brand-new-account.json');

    expect(snapshot.firstPublicActivityDate).toBeNull();
  });

  it('throws with the attempted path for a nonexistent fixture', () => {
    expect(() => loadHistorySnapshotFixture('no-such-fixture.json')).toThrow(
      /test-fixtures[\\/]no-such-fixture\.json/,
    );
  });
});
