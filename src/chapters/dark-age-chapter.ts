import { differenceInDays } from '../dates/difference-in-days.js';
import type { HistorySnapshot } from '../history-snapshot.js';
import type { DarkAgeChapter } from './chapter.js';

export const DARK_AGE_THRESHOLD_DAYS = 180;

export function detectDarkAgeChapters(snapshot: HistorySnapshot): DarkAgeChapter[] {
  const contributionDays = snapshot.contributionDays;
  if (contributionDays.length === 0) return [];

  const chapters: DarkAgeChapter[] = [];
  for (let dayIndex = 1; dayIndex < contributionDays.length; dayIndex += 1) {
    const silenceBefore = contributionDays[dayIndex - 1].date;
    const returnDate = contributionDays[dayIndex].date;
    const gapDays = differenceInDays(silenceBefore, returnDate) - 1;
    if (gapDays < DARK_AGE_THRESHOLD_DAYS) continue;
    chapters.push({
      kind: 'dark-age',
      date: addDays(silenceBefore, 1),
      endDate: addDays(returnDate, -1),
      lengthDays: gapDays,
    });
  }

  const lastContributionDate = contributionDays[contributionDays.length - 1].date;
  const trailingGapDays = differenceInDays(lastContributionDate, snapshot.capturedAtDate) - 1;
  if (trailingGapDays >= DARK_AGE_THRESHOLD_DAYS) {
    chapters.push({
      kind: 'dark-age',
      date: addDays(lastContributionDate, 1),
      endDate: null,
      lengthDays: trailingGapDays,
    });
  }

  return chapters;
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
