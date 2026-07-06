import { detectChapters } from './chapters/detect-chapters.js';
import type { HistorySnapshot } from './history-snapshot.js';
import { narrateChapter } from './narration/narrate-chapter.js';
import { buildMuralScene } from './mural/build-mural-scene.js';
import { renderAnimatedMuralSvg } from './mural/render-animated-mural-svg.js';
import { worlds } from './mural/worlds/catalog.js';
import type { WorldName } from './mural/worlds/world.js';
import { scoreStrengths } from './strengths/score-strengths.js';

export function renderMural(snapshot: HistorySnapshot, world: WorldName = 'desert'): string {
  const narratedChapters = detectChapters(snapshot).map((chapter) => ({
    chapter,
    narration: narrateChapter(chapter),
  }));
  const scene = buildMuralScene(snapshot, narratedChapters, scoreStrengths(snapshot));
  return renderAnimatedMuralSvg(scene, worlds[world]);
}
