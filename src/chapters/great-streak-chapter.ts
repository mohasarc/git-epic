import { differenceInDays } from '../dates/difference-in-days.js';
import type { HistorySnapshot } from '../history-snapshot.js';
import type { GreatStreakChapter } from './chapter.js';

export const GREAT_STREAK_THRESHOLD_DAYS = 30;

type Streak = { startDate: string; endDate: string; lengthDays: number };

export function detectGreatStreakChapters(snapshot: HistorySnapshot): GreatStreakChapter[] {
  const longest = findLongestStreak(snapshot.contributionDays.map((day) => day.date));
  if (longest === null || longest.lengthDays < GREAT_STREAK_THRESHOLD_DAYS) return [];
  return [
    {
      kind: 'great-streak',
      date: longest.startDate,
      endDate: longest.endDate,
      lengthDays: longest.lengthDays,
    },
  ];
}

function findLongestStreak(contributionDates: string[]): Streak | null {
  let longest: Streak | null = null;
  let streakStartDate: string | null = null;
  for (let dateIndex = 0; dateIndex < contributionDates.length; dateIndex += 1) {
    streakStartDate ??= contributionDates[dateIndex];
    const nextDate = contributionDates[dateIndex + 1];
    if (nextDate !== undefined && differenceInDays(contributionDates[dateIndex], nextDate) === 1) {
      continue;
    }
    const lengthDays = differenceInDays(streakStartDate, contributionDates[dateIndex]) + 1;
    if (longest === null || lengthDays > longest.lengthDays) {
      longest = { startDate: streakStartDate, endDate: contributionDates[dateIndex], lengthDays };
    }
    streakStartDate = null;
  }
  return longest;
}
