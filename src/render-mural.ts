import { detectChapters } from './chapters/detect-chapters.js';
import type { HistorySnapshot } from './history-snapshot.js';
import { narrateChapter } from './narration/narrate-chapter.js';
import { buildMuralScene } from './mural/build-mural-scene.js';
import { renderAnimatedMuralSvg } from './mural/render-animated-mural-svg.js';
import { scoreStrengths } from './strengths/score-strengths.js';

export function renderMural(snapshot: HistorySnapshot): string {
  const narratedChapters = detectChapters(snapshot).map((chapter) => ({
    chapter,
    narration: narrateChapter(chapter),
  }));
  return renderAnimatedMuralSvg(buildMuralScene(snapshot, narratedChapters, scoreStrengths(snapshot)));
}
