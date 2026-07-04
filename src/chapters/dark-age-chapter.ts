import { addDays } from '../dates/add-days.js';
import { differenceInDays } from '../dates/difference-in-days.js';
import type { HistorySnapshot } from '../history-snapshot.js';
import type { DarkAgeChapter } from './chapter.js';

export const DARK_AGE_THRESHOLD_DAYS = 180;

export function detectDarkAgeChapters(snapshot: HistorySnapshot): DarkAgeChapter[] {
  const contributionDays = snapshot.contributionDays;
  if (contributionDays.length === 0) return [];

  const chapters: DarkAgeChapter[] = [];
  for (let dayIndex = 1; dayIndex < contributionDays.length; dayIndex += 1) {
    const contributionDateBeforeGap = contributionDays[dayIndex - 1].date;
    const returnDate = contributionDays[dayIndex].date;
    const gapDays = differenceInDays(contributionDateBeforeGap, returnDate) - 1;
    if (gapDays < DARK_AGE_THRESHOLD_DAYS) continue;
    chapters.push({
      kind: 'dark-age',
      date: addDays(contributionDateBeforeGap, 1),
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
