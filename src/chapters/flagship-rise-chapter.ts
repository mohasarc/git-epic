import type { HistorySnapshot } from '../history-snapshot.js';
import type { FlagshipRiseChapter } from './chapter.js';

export const FLAGSHIP_THRESHOLD_STARS = 100;

export function detectFlagshipRiseChapters(snapshot: HistorySnapshot): FlagshipRiseChapter[] {
  return snapshot.repositories
    .filter((repository) => repository.starCount >= FLAGSHIP_THRESHOLD_STARS)
    .map((repository) => ({
      kind: 'flagship-rise' as const,
      date: repository.createdDate,
      repoName: repository.name,
      starCount: repository.starCount,
    }));
}
