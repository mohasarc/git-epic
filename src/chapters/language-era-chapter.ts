import type { HistorySnapshot } from '../history-snapshot.js';
import type { LanguageEraChapter } from './chapter.js';

export function detectLanguageEraChapters(snapshot: HistorySnapshot): LanguageEraChapter[] {
  const activeYearSpans = snapshot.repositories.flatMap((repository) => {
    if (repository.primaryLanguage === null || repository.lastPushedDate === null) return [];
    return [
      {
        language: repository.primaryLanguage,
        firstYear: yearOf(repository.createdDate),
        lastYear: yearOf(repository.lastPushedDate),
      },
    ];
  });
  if (activeYearSpans.length === 0) return [];

  const firstScanYear = Math.min(...activeYearSpans.map((span) => span.firstYear));
  const lastScanYear = Math.max(...activeYearSpans.map((span) => span.lastYear));

  const chapters: LanguageEraChapter[] = [];
  let incumbentLanguage: string | null = null;
  for (let year = firstScanYear; year <= lastScanYear; year += 1) {
    const dominantLanguage = dominantLanguageOfYear(activeYearSpans, year, incumbentLanguage);
    if (dominantLanguage === null) continue;
    if (incumbentLanguage !== null && dominantLanguage !== incumbentLanguage) {
      chapters.push({
        kind: 'language-era',
        date: `${year}-01-01`,
        year,
        fromLanguage: incumbentLanguage,
        toLanguage: dominantLanguage,
      });
    }
    incumbentLanguage = dominantLanguage;
  }
  return chapters;
}

type ActiveYearSpan = { language: string; firstYear: number; lastYear: number };

function dominantLanguageOfYear(
  spans: ActiveYearSpan[],
  year: number,
  incumbentLanguage: string | null,
): string | null {
  const activeRepoCountByLanguage = new Map<string, number>();
  for (const span of spans) {
    if (year < span.firstYear || year > span.lastYear) continue;
    activeRepoCountByLanguage.set(
      span.language,
      (activeRepoCountByLanguage.get(span.language) ?? 0) + 1,
    );
  }
  if (activeRepoCountByLanguage.size === 0) return null;

  const highestCount = Math.max(...activeRepoCountByLanguage.values());
  const leadingLanguages = [...activeRepoCountByLanguage.entries()]
    .filter(([, count]) => count === highestCount)
    .map(([language]) => language)
    .sort();
  if (incumbentLanguage !== null && leadingLanguages.includes(incumbentLanguage)) {
    return incumbentLanguage;
  }
  return leadingLanguages[0];
}

function yearOf(date: string): number {
  return Number(date.slice(0, 4));
}
