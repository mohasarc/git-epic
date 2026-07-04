import { describe, expect, it } from 'vitest';

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
});
