import type { HistorySnapshot } from '../history-snapshot.js';
import type { Chapter } from '../chapters/chapter.js';
import type { ChapterSceneSegment, Timeline, TimelineSegment } from './timeline.js';
import { CREDIT_LINE, epicOfLine } from './attribution.js';
import { deriveSeedFromHandle } from './derive-seed-from-handle.js';
import {
  CHAPTER_SCENE_SECONDS,
  PRESENT_DAY_CARD_SECONDS,
  TITLE_CARD_SECONDS,
} from './timing-constants.js';

export type NarratedChapter = { chapter: Chapter; narration: string };

export function buildTimeline(
  snapshot: HistorySnapshot,
  narratedChapters: NarratedChapter[],
): Timeline {
  const originYear = Number(snapshot.accountCreatedDate.slice(0, 4));

  const segments: TimelineSegment[] = [
    {
      kind: 'title-card',
      startSeconds: 0,
      durationSeconds: TITLE_CARD_SECONDS,
      handle: snapshot.handle,
      originYear,
    },
  ];

  let nextStartSeconds = TITLE_CARD_SECONDS;
  for (const { chapter, narration } of narratedChapters) {
    const scene: ChapterSceneSegment = {
      kind: 'chapter-scene',
      startSeconds: nextStartSeconds,
      durationSeconds: CHAPTER_SCENE_SECONDS,
      chapter,
      narration,
    };
    segments.push(scene);
    nextStartSeconds += CHAPTER_SCENE_SECONDS;
  }

  segments.push({
    kind: 'present-day-card',
    startSeconds: nextStartSeconds,
    durationSeconds: PRESENT_DAY_CARD_SECONDS,
    capturedAtDate: snapshot.capturedAtDate,
  });

  return {
    handle: snapshot.handle,
    seed: deriveSeedFromHandle(snapshot.handle),
    segments,
    replayEndSeconds: nextStartSeconds + PRESENT_DAY_CARD_SECONDS,
    ambient: {
      handle: snapshot.handle,
      epicOfLine: epicOfLine(snapshot.handle),
      creditLine: CREDIT_LINE,
    },
  };
}
