import type { HistorySnapshot } from '../history-snapshot.js';
import type { Chapter } from './chapter.js';
import { detectOriginChapter } from './origin-chapter.js';

/** Stage 2 adds ordering, precedence tie-breaking, and the 8-chapter cap here. */
export function detectChapters(snapshot: HistorySnapshot): Chapter[] {
  return [detectOriginChapter(snapshot)];
}
