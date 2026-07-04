import { describe, expect, it } from 'vitest';

import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { detectOriginChapter } from './origin-chapter.js';

describe('detectOriginChapter', () => {
  it('dates the chapter from firstPublicActivityDate', () => {
    const snapshot = loadHistorySnapshotFixture('single-contribution-account.json');

    expect(detectOriginChapter(snapshot)).toEqual({ kind: 'origin', date: '2019-03-20' });
  });

  it('returns an undated chapter for null activity', () => {
    const snapshot = loadHistorySnapshotFixture('brand-new-account.json');

    expect(detectOriginChapter(snapshot)).toEqual({ kind: 'origin', date: null });
  });
});
