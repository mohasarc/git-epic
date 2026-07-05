import { describe, expect, it } from 'vitest';
import { detectChapters } from '../chapters/detect-chapters.js';
import { addDays } from '../dates/add-days.js';
import { differenceInDays } from '../dates/difference-in-days.js';
import { narrateChapter } from '../narration/narrate-chapter.js';
import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import type { NarratedChapter } from '../timeline/build-timeline.js';
import { partitionEras } from './partition-eras.js';

function narrate(snapshot: Parameters<typeof detectChapters>[0]): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function midpoint(earlierDate: string, laterDate: string): string {
  return addDays(earlierDate, Math.round(differenceInDays(earlierDate, laterDate) / 2));
}

describe.each(['rich-history-account', 'fifteen-year-overflow'])(
  'partitionEras covers %s',
  (fixtureName) => {
    const snapshot = loadHistorySnapshotFixture(`${fixtureName}.json`);
    const eras = partitionEras(snapshot, narrate(snapshot));

    it('spans firstPublicActivityDate to capturedAtDate', () => {
      expect(eras[0].startDate).toBe(snapshot.firstPublicActivityDate);
      expect(eras[eras.length - 1].endDate).toBe(snapshot.capturedAtDate);
    });

    it('is contiguous with no gap or overlap', () => {
      for (let index = 0; index + 1 < eras.length; index++) {
        expect(eras[index].endDate).toBe(eras[index + 1].startDate);
        expect(eras[index].startDate <= eras[index].endDate).toBe(true);
      }
    });

    it('places every contribution day under exactly one era', () => {
      for (const day of snapshot.contributionDays) {
        const covering = eras.filter((era, index) => {
          const isLast = index === eras.length - 1;
          return day.date >= era.startDate && (isLast ? day.date <= era.endDate : day.date < era.endDate);
        });
        expect(covering).toHaveLength(1);
      }
    });
  },
);

describe('partitionEras windows', () => {
  const snapshot = buildHistorySnapshot({
    firstPublicActivityDate: '2020-01-01',
    capturedAtDate: '2026-01-01',
  });

  it('bounds a point chapter by its neighbors\' midpoints', () => {
    const origin: NarratedChapter = { chapter: { kind: 'origin', date: '2020-01-01' }, narration: '' };
    const flagship: NarratedChapter = {
      chapter: { kind: 'flagship-rise', date: '2022-01-01', repoName: 'atlas', starCount: 500 },
      narration: '',
    };
    const eras = partitionEras(snapshot, [origin, flagship]);

    expect(eras).toHaveLength(3);
    expect(eras[1].chapter?.kind).toBe('flagship-rise');
    expect(eras[1].startDate).toBe(midpoint('2020-01-01', '2022-01-01'));
    expect(eras[1].endDate).toBe(midpoint('2022-01-01', '2026-01-01'));
  });

  it('yields two contiguous eras for a lone origin plus present day', () => {
    const origin: NarratedChapter = { chapter: { kind: 'origin', date: '2020-01-01' }, narration: '' };
    const eras = partitionEras(snapshot, [origin]);

    expect(eras).toHaveLength(2);
    expect(eras[0].chapter?.kind).toBe('origin');
    expect(eras[1].chapter).toBeNull();
    expect(eras[0].endDate).toBe(eras[1].startDate);
    expect(eras[0].startDate).toBe('2020-01-01');
    expect(eras[1].endDate).toBe('2026-01-01');
  });
});

describe('partitionEras for a brand-new account', () => {
  it('returns a single accountCreatedDate to capturedAtDate era', () => {
    const snapshot = buildHistorySnapshot({
      firstPublicActivityDate: null,
      accountCreatedDate: '2026-06-30',
      capturedAtDate: '2026-07-04',
    });
    expect(partitionEras(snapshot, [])).toEqual([
      { chapter: null, startDate: '2026-06-30', endDate: '2026-07-04', tier: 'modern' },
    ]);
  });
});

describe('partitionEras determinism', () => {
  it('produces identical eras for identical inputs', () => {
    const snapshot = loadHistorySnapshotFixture('rich-history-account.json');
    const chapters = narrate(snapshot);
    expect(partitionEras(snapshot, chapters)).toEqual(partitionEras(snapshot, chapters));
  });
});
