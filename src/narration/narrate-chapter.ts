import type {
  Chapter,
  DarkAgeChapter,
  GreatStreakChapter,
  OriginChapter,
  ProlificacyChapter,
} from '../chapters/chapter.js';
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

function unnarratedChapterKind(kind: never): never {
  throw new Error(`no narration template for chapter kind: ${String(kind)}`);
}
