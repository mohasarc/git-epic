import { describe, expect, it } from 'vitest';

import { detectChapters } from '../chapters/detect-chapters.js';
import { narrateChapter } from '../narration/narrate-chapter.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { buildTimeline } from './build-timeline.js';
import type { NarratedChapter } from './build-timeline.js';

const singleContributionTimeline = () => {
  const snapshot = loadHistorySnapshotFixture('single-contribution-account.json');
  const narratedChapters: NarratedChapter[] = detectChapters(snapshot).map((chapter) => ({
    chapter,
    narration: narrateChapter(chapter),
  }));
  return buildTimeline(snapshot, narratedChapters);
};

describe('buildTimeline', () => {
  it('sequences title-card, chapter-scene, present-day-card for the single-contribution fixture', () => {
    const timeline = singleContributionTimeline();

    expect(timeline.segments.map((segment) => segment.kind)).toEqual([
      'title-card',
      'chapter-scene',
      'present-day-card',
    ]);
    expect(timeline.segments[0]).toMatchObject({ startSeconds: 0, durationSeconds: 3 });
    expect(timeline.segments[1]).toMatchObject({
      startSeconds: 3,
      durationSeconds: 3.5,
      chapter: { kind: 'origin', date: '2019-03-20' },
      narration:
        'In the year 2019, the developer first set foot upon the public forge, and the epic began.',
    });
    expect(timeline.segments[2]).toMatchObject({ startSeconds: 6.5, durationSeconds: 3 });
    expect(timeline.replayEndSeconds).toBe(9.5);
  });

  it('carries handle and origin year from accountCreatedDate on the title card', () => {
    const timeline = singleContributionTimeline();

    expect(timeline.segments[0]).toMatchObject({
      kind: 'title-card',
      handle: 'first-spark',
      originYear: 2019,
    });
  });

  it('carries capturedAtDate on the present-day card', () => {
    const timeline = singleContributionTimeline();

    expect(timeline.segments[2]).toMatchObject({
      kind: 'present-day-card',
      capturedAtDate: '2026-07-04',
    });
  });

  it('builds the ambient scene with attribution lines', () => {
    const timeline = singleContributionTimeline();

    expect(timeline.ambient).toEqual({
      handle: 'first-spark',
      epicOfLine: 'The Epic of first-spark',
      creditLine: '✦ forge yours at git-epic.dev',
    });
  });

  it('derives the seed from the handle', () => {
    expect(singleContributionTimeline().seed).toBe(3131498761);
  });

  it('is deterministic for the same fixture', () => {
    expect(singleContributionTimeline()).toEqual(singleContributionTimeline());
  });
});
