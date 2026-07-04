import type { Chapter } from '../chapters/chapter.js';

export type TitleCardSegment = {
  kind: 'title-card';
  startSeconds: number;
  durationSeconds: number;
  handle: string;
  originYear: number;
};

export type ChapterSceneSegment = {
  kind: 'chapter-scene';
  startSeconds: number;
  durationSeconds: number;
  chapter: Chapter;
  narration: string;
};

export type PresentDayCardSegment = {
  kind: 'present-day-card';
  startSeconds: number;
  durationSeconds: number;
  capturedAtDate: string;
};

export type TimelineSegment = TitleCardSegment | ChapterSceneSegment | PresentDayCardSegment;

export type AmbientScene = {
  handle: string;
  epicOfLine: string;
  creditLine: string;
  /** 1..5, from repository count. */
  orbitingBodyCount: number;
  /** Floor 8, banded from total star count. */
  twinkleStarCount: number;
};

export type Timeline = {
  handle: string;
  seed: number;
  segments: TimelineSegment[];
  replayEndSeconds: number;
  ambient: AmbientScene;
};
