import type { Chapter } from './chapter.js';
import { CHAPTER_TYPE_PRECEDENCE } from './chapter.js';

export const MAX_CHAPTERS = 8;

export function sortChaptersForDisplay(chapters: Chapter[]): Chapter[] {
  return [...chapters].sort(
    (left, right) =>
      compareDates(left.date, right.date) ||
      comparePrecedence(left, right) ||
      compareWithinType(left, right),
  );
}

export function capChaptersByDrama(chapters: Chapter[]): Chapter[] {
  if (chapters.length <= MAX_CHAPTERS) return [...chapters];
  return [...chapters]
    .sort(
      (left, right) =>
        comparePrecedence(left, right) ||
        compareDates(left.date, right.date) ||
        compareWithinType(left, right),
    )
    .slice(0, MAX_CHAPTERS);
}

/** Null only on a zero-activity Origin; sorts before every date. */
function compareDates(left: string | null, right: string | null): number {
  if (left === right) return 0;
  if (left === null) return -1;
  if (right === null) return 1;
  return left < right ? -1 : 1;
}

function comparePrecedence(left: Chapter, right: Chapter): number {
  return CHAPTER_TYPE_PRECEDENCE.indexOf(left.kind) - CHAPTER_TYPE_PRECEDENCE.indexOf(right.kind);
}

function compareWithinType(left: Chapter, right: Chapter): number {
  if (left.kind === 'star-milestone' && right.kind === 'star-milestone') {
    return left.threshold - right.threshold;
  }
  if (left.kind === 'flagship-rise' && right.kind === 'flagship-rise') {
    return compareCodeUnits(left.repoName, right.repoName);
  }
  return 0;
}

/** Locale-independent so ordering never varies by environment. */
function compareCodeUnits(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}
