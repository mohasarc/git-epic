import type { HistorySnapshot } from '../history-snapshot.js';
import type { Chapter } from './chapter.js';
import { detectDarkAgeChapters } from './dark-age-chapter.js';
import { detectGreatStreakChapters } from './great-streak-chapter.js';
import { detectOriginChapter } from './origin-chapter.js';
import { detectProlificacyChapters } from './prolificacy-chapter.js';

/** Stage 2 adds ordering, precedence tie-breaking, and the 8-chapter cap here. */
export function detectChapters(snapshot: HistorySnapshot): Chapter[] {
  return [
    detectOriginChapter(snapshot),
    ...detectDarkAgeChapters(snapshot),
    ...detectGreatStreakChapters(snapshot),
    ...detectProlificacyChapters(snapshot),
  ];
}
