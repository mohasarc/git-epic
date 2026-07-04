import type {
  Chapter,
  DarkAgeChapter,
  FlagshipRiseChapter,
  GreatStreakChapter,
  LanguageEraChapter,
  OriginChapter,
  ProlificacyChapter,
  StarMilestoneChapter,
} from '../chapters/chapter.js';
import { spellDramaticQuantity } from './spell-dramatic-quantity.js';
import { spellExactCount } from './spell-exact-count.js';

const datedOriginTemplate = (year: string): string =>
  `In the year ${year}, the developer first set foot upon the public forge, and the epic began.`;

const undatedOriginTemplate = 'The chronicle is yet unwritten, and the epic has just begun.';

const endedDarkAgeTemplate = (days: string): string =>
  `Then came the Dark Age: ${days} days, and not a single commit.`;

const ongoingDarkAgeTemplate = (days: string): string =>
  `Then fell the Dark Age: ${days} days without a commit, and the silence endures.`;

const greatStreakTemplate = (days: string): string =>
  `Then began the relentless campaign: ${days} days of unbroken toil.`;

const prolificacyTemplate = (year: number): string =>
  `Then came the year of abundance: the labors of ${year} doubled those of the year before.`;

const flagshipRiseTemplate = (repoName: string, stars: string): string =>
  `And lo, ${repoName} rose from nothing, and ${stars} stars gathered to witness it.`;

const starMilestoneTemplate = (stars: string): string =>
  `And renown gathered upon the developer: ${stars} stars in all.`;

/** Fixed, never computed — the thresholds are part of the register. */
const spelledMilestoneThresholds = {
  100: 'a hundred',
  1000: 'a thousand',
  10000: 'ten thousand',
} as const;

const languageEraTemplate = (year: number, fromLanguage: string): string =>
  `In the year ${year}, the developer forsook ${fromLanguage}, and there was much refactoring.`;

export function narrateChapter(chapter: Chapter): string {
  const kind = chapter.kind;
  switch (kind) {
    case 'origin':
      return narrateOriginChapter(chapter);
    case 'dark-age':
      return narrateDarkAgeChapter(chapter);
    case 'great-streak':
      return narrateGreatStreakChapter(chapter);
    case 'prolificacy':
      return narrateProlificacyChapter(chapter);
    case 'flagship-rise':
      return narrateFlagshipRiseChapter(chapter);
    case 'star-milestone':
      return narrateStarMilestoneChapter(chapter);
    case 'language-era':
      return narrateLanguageEraChapter(chapter);
  }
  return unnarratedChapterKind(kind);
}

function narrateOriginChapter(chapter: OriginChapter): string {
  if (chapter.date === null) return undatedOriginTemplate;
  return datedOriginTemplate(chapter.date.slice(0, 4));
}

function narrateDarkAgeChapter(chapter: DarkAgeChapter): string {
  const days = spellExactCount(chapter.lengthDays);
  if (chapter.endDate === null) return ongoingDarkAgeTemplate(days);
  return endedDarkAgeTemplate(days);
}

function narrateGreatStreakChapter(chapter: GreatStreakChapter): string {
  return greatStreakTemplate(spellExactCount(chapter.lengthDays));
}

function narrateProlificacyChapter(chapter: ProlificacyChapter): string {
  return prolificacyTemplate(chapter.year);
}

function narrateFlagshipRiseChapter(chapter: FlagshipRiseChapter): string {
  return flagshipRiseTemplate(chapter.repoName, spellDramaticQuantity(chapter.starCount));
}

function narrateStarMilestoneChapter(chapter: StarMilestoneChapter): string {
  return starMilestoneTemplate(spelledMilestoneThresholds[chapter.threshold]);
}

function narrateLanguageEraChapter(chapter: LanguageEraChapter): string {
  return languageEraTemplate(chapter.year, chapter.fromLanguage);
}

function unnarratedChapterKind(kind: never): never {
  throw new Error(`no narration template for chapter kind: ${String(kind)}`);
}
