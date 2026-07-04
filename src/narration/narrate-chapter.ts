import type { Chapter, OriginChapter } from '../chapters/chapter.js';

const datedOriginTemplate = (year: string): string =>
  `In the year ${year}, the developer first set foot upon the public forge, and the epic began.`;

const undatedOriginTemplate = 'The chronicle is yet unwritten, and the epic has just begun.';

export function narrateChapter(chapter: Chapter): string {
  const kind = chapter.kind;
  switch (kind) {
    case 'origin':
      return narrateOriginChapter(chapter);
  }
  return unnarratedChapterKind(kind);
}

function narrateOriginChapter(chapter: OriginChapter): string {
  if (chapter.date === null) return undatedOriginTemplate;
  return datedOriginTemplate(chapter.date.slice(0, 4));
}

function unnarratedChapterKind(kind: never): never {
  throw new Error(`no narration template for chapter kind: ${String(kind)}`);
}
