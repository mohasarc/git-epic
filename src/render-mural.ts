import { detectChapters } from './chapters/detect-chapters.js';
import type { HistorySnapshot } from './history-snapshot.js';
import { narrateChapter } from './narration/narrate-chapter.js';
import { buildMuralScene } from './mural/build-mural-scene.js';
import type { MuralScene } from './mural/mural-scene.js';
import { renderAnimatedMuralSvg } from './mural/render-animated-mural-svg.js';
import { worlds } from './mural/worlds/catalog.js';
import type { WorldName } from './mural/worlds/world.js';
import { scoreStrengths } from './strengths/score-strengths.js';

/** The single detect→narrate→score→scene path both mural surfaces share, so story and badges match by construction. */
export function buildSceneFromSnapshot(snapshot: HistorySnapshot): MuralScene {
  const narratedChapters = detectChapters(snapshot).map((chapter) => ({
    chapter,
    narration: narrateChapter(chapter),
  }));
  return buildMuralScene(snapshot, narratedChapters, scoreStrengths(snapshot));
}

export function renderMural(snapshot: HistorySnapshot, world: WorldName = 'desert'): string {
  return renderAnimatedMuralSvg(buildSceneFromSnapshot(snapshot), worlds[world]);
}
