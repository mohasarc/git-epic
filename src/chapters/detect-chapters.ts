import type { HistorySnapshot } from '../history-snapshot.js';
import type { Chapter } from './chapter.js';
import { detectDarkAgeChapters } from './dark-age-chapter.js';
import { detectFlagshipRiseChapters } from './flagship-rise-chapter.js';
import { detectGreatStreakChapters } from './great-streak-chapter.js';
import { detectLanguageEraChapters } from './language-era-chapter.js';
import { detectOriginChapter } from './origin-chapter.js';
import { detectProlificacyChapters } from './prolificacy-chapter.js';
import { detectStarMilestoneChapters } from './star-milestone-chapter.js';
import { capChaptersByDrama, sortChaptersForDisplay } from './order-chapters.js';

export function detectChapters(snapshot: HistorySnapshot): Chapter[] {
  const firedChapters = [
    detectOriginChapter(snapshot),
    ...detectDarkAgeChapters(snapshot),
    ...detectGreatStreakChapters(snapshot),
    ...detectProlificacyChapters(snapshot),
    ...detectFlagshipRiseChapters(snapshot),
    ...detectStarMilestoneChapters(snapshot),
    ...detectLanguageEraChapters(snapshot),
  ];
  return sortChaptersForDisplay(capChaptersByDrama(firedChapters));
}
