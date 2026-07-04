import type { HistorySnapshot } from '../history-snapshot.js';
import type { ProlificacyChapter } from './chapter.js';

export function detectProlificacyChapters(snapshot: HistorySnapshot): ProlificacyChapter[] {
  const totalsByYear = new Map<number, number>();
  for (const contributionDay of snapshot.contributionDays) {
    const year = Number(contributionDay.date.slice(0, 4));
    totalsByYear.set(year, (totalsByYear.get(year) ?? 0) + contributionDay.count);
  }

  const capturedYear = Number(snapshot.capturedAtDate.slice(0, 4));
  const completedYearsAscending = [...totalsByYear.keys()]
    .filter((year) => year < capturedYear)
    .sort((left, right) => left - right);

  const chapters: ProlificacyChapter[] = [];
  for (const year of completedYearsAscending) {
    const contributionCount = totalsByYear.get(year) ?? 0;
    const priorYearContributionCount = totalsByYear.get(year - 1) ?? 0;
    if (priorYearContributionCount === 0) continue;
    if (contributionCount < priorYearContributionCount * 2) continue;
    chapters.push({
      kind: 'prolificacy',
      date: `${year}-01-01`,
      year,
      contributionCount,
      priorYearContributionCount,
    });
  }
  return chapters;
}
