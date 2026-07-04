import type { HistorySnapshot } from '../history-snapshot.js';
import type { StarMilestoneChapter } from './chapter.js';

export const STAR_MILESTONE_THRESHOLDS = [100, 1000, 10000] as const;

export function detectStarMilestoneChapters(snapshot: HistorySnapshot): StarMilestoneChapter[] {
  const repositoriesByCreationThenName = [...snapshot.repositories].sort((left, right) =>
    left.createdDate === right.createdDate
      ? compareCodeUnits(left.name, right.name)
      : compareCodeUnits(left.createdDate, right.createdDate),
  );

  const chapters: StarMilestoneChapter[] = [];
  let cumulativeStarCount = 0;
  let nextThresholdIndex = 0;
  for (const repository of repositoriesByCreationThenName) {
    cumulativeStarCount += repository.starCount;
    while (
      nextThresholdIndex < STAR_MILESTONE_THRESHOLDS.length &&
      cumulativeStarCount >= STAR_MILESTONE_THRESHOLDS[nextThresholdIndex]
    ) {
      chapters.push({
        kind: 'star-milestone',
        date: repository.createdDate,
        threshold: STAR_MILESTONE_THRESHOLDS[nextThresholdIndex],
      });
      nextThresholdIndex += 1;
    }
  }
  return chapters;
}

/** Locale-independent so the crossing repo never varies by environment. */
function compareCodeUnits(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}
