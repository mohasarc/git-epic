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
      followerCount: 0,
      repositories: [],
      pullRequestsOpenedCount: 0,
      issuesOpenedCount: 0,
    });
  });

  it('loads the brand-new account fixture with null first public activity', () => {
    const snapshot = loadHistorySnapshotFixture('brand-new-account.json');

    expect(snapshot.firstPublicActivityDate).toBeNull();
    expect(snapshot.contributionDays).toEqual([]);
    expect(snapshot.repositories).toEqual([]);
  });

  it('loads the rich history account fixture with fork and follower fields', () => {
    const snapshot = loadHistorySnapshotFixture('rich-history-account.json');

    expect(snapshot.handle).toBe('saga-weaver');
    expect(snapshot.contributionDays.length).toBe(58);
    expect(snapshot.repositories.length).toBe(2);
    expect(snapshot.followerCount).toBe(1200);
    expect(snapshot.repositories.map((repository) => repository.forkCount)).toEqual([140, 12]);
    expect(snapshot.repositories.map((repository) => repository.isFork)).toEqual([false, false]);
    expect(snapshot.pullRequestsOpenedCount).toBe(640);
    expect(snapshot.issuesOpenedCount).toBe(210);
  });

  it('loads the fifteen-year overflow fixture', () => {
    const snapshot = loadHistorySnapshotFixture('fifteen-year-overflow.json');

    expect(snapshot.handle).toBe('long-march');
    expect(snapshot.contributionDays.length).toBe(71);
    expect(snapshot.repositories.length).toBe(4);
  });

  it('loads the captured live account fixture', () => {
    const snapshot = loadHistorySnapshotFixture('mohasarc-captured.json');

    expect(snapshot.handle).toBe('mohasarc');
    expect(snapshot.contributionDays.length).toBeGreaterThan(0);
    expect(snapshot.repositories.length).toBeGreaterThan(0);
  });

  it('throws with the attempted path for a nonexistent fixture', () => {
    expect(() => loadHistorySnapshotFixture('no-such-fixture.json')).toThrow(
      /test-fixtures[\\/]no-such-fixture\.json/,
    );
  });
});
