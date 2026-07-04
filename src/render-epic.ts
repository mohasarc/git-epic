import { detectChapters } from './chapters/detect-chapters.js';
import type { HistorySnapshot } from './history-snapshot.js';
import { narrateChapter } from './narration/narrate-chapter.js';
import { buildTimeline } from './timeline/build-timeline.js';
import { renderEpicSvg } from './rendering/render-epic-svg.js';

export function renderEpic(snapshot: HistorySnapshot): string {
  const narratedChapters = detectChapters(snapshot).map((chapter) => ({
    chapter,
    narration: narrateChapter(chapter),
  }));
  return renderEpicSvg(buildTimeline(snapshot, narratedChapters));
}
