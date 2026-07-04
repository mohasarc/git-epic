import type { ChapterSceneSegment } from '../../timeline/timeline.js';
import { formatSvgNumber } from '../format-svg-number.js';
import { CENTER_X, SCENE_CENTER_Y, expandingRing, sparkGlow } from '../scene-primitives.js';
import { PALETTE } from '../visual-vocabulary.js';

export function originScene(segment: ChapterSceneSegment): string {
  return (
    expandingRing({
      cx: CENTER_X,
      cy: SCENE_CENTER_Y,
      beginSeconds: segment.startSeconds + 0.2,
      fromRadius: 14,
      toRadius: 70,
      strokeColor: PALETTE.spark,
      strokeWidth: 0.6,
      peakOpacity: 0.5,
    }) +
    expandingRing({
      cx: CENTER_X,
      cy: SCENE_CENTER_Y,
      beginSeconds: segment.startSeconds + 0.5,
      fromRadius: 20,
      toRadius: 105,
      strokeColor: PALETTE.orbitIndigo,
      strokeWidth: 0.5,
      peakOpacity: 0.4,
    }) +
    sparkGlow(CENTER_X, SCENE_CENTER_Y, 34) +
    `<circle cx="${formatSvgNumber(CENTER_X)}" cy="${formatSvgNumber(SCENE_CENTER_Y)}" r="5" fill="${PALETTE.spark}"/>`
  );
}
