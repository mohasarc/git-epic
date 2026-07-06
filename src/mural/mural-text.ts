import type { Chapter } from '../chapters/chapter.js';
import type { HistorySnapshot } from '../history-snapshot.js';
import type { StrengthsResult } from '../strengths/score-strengths.js';
import { epicOfLine } from '../timeline/attribution.js';
import type { NarratedChapter } from '../timeline/build-timeline.js';

export const PRESENT_DAY_LABEL = 'PRESENT DAY';

const PRESENT_DAY_TITLE = 'PRESENT DAY';
const DEFAULT_ERA_TITLE = 'AN EPIC UNFOLDS';
const DEFAULT_DESCRIPTION = 'A public forge journey, freshly begun.';

/** All-caps title per chapter kind; the Record shape is the exhaustiveness guard. */
const ERA_TITLE_BY_KIND: Record<Chapter['kind'], string> = {
  origin: 'THE FOUNDING',
  'dark-age': 'THE DARK AGE',
  'great-streak': 'THE LONG CAMPAIGN',
  prolificacy: 'THE YEAR OF ABUNDANCE',
  'flagship-rise': 'THE FLAGSHIP RISES',
  'star-milestone': 'A GATHERING OF STARS',
  'language-era': 'THE GREAT REFACTOR',
};

export function eraTitle(chapter: Chapter | null): string {
  if (chapter === null) return PRESENT_DAY_TITLE;
  return ERA_TITLE_BY_KIND[chapter.kind] ?? DEFAULT_ERA_TITLE;
}

/** Handle plus one real fact; falls back to the origin year, never empty. */
export function stripSubtitle(snapshot: HistorySnapshot, strengths: StrengthsResult): string {
  const fact = realFact(snapshot, strengths);
  if (fact !== null) return `${snapshot.handle} · ${fact}`;
  return `${snapshot.handle} · since ${snapshot.accountCreatedDate.slice(0, 4)}`;
}

function realFact(snapshot: HistorySnapshot, strengths: StrengthsResult): string | null {
  if (strengths.dominantLanguage !== null) return `${strengths.dominantLanguage.name} artisan`;
  const ownRepo = snapshot.repositories.find((repository) => !repository.isFork);
  if (ownRepo !== undefined) return `author of ${ownRepo.name}`;
  return null;
}

export function accessibleTitle(handle: string): string {
  return epicOfLine(handle);
}

export function accessibleDescription(narratedChapters: NarratedChapter[]): string {
  const prose = narratedChapters
    .map((narrated) => narrated.narration)
    .filter((narration) => narration.length > 0)
    .join(' ');
  return prose.length > 0 ? prose : DEFAULT_DESCRIPTION;
}
