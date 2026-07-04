import type { ChapterSceneSegment } from '../../timeline/timeline.js';
import { formatSvgNumber } from '../format-svg-number.js';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CENTER_X,
  SCENE_CENTER_Y,
  expandingRing,
} from '../scene-primitives.js';
import { PALETTE } from '../visual-vocabulary.js';

const VEIL_OPACITY = 0.55;
const EMBER_DIM_SECONDS = 2.4;
const RING_BEGIN_OFFSET_SECONDS = 0.3;

export function darkAgeScene(segment: ChapterSceneSegment): string {
  const beginSeconds = segment.startSeconds + RING_BEGIN_OFFSET_SECONDS;
  return (
    `<rect width="${formatSvgNumber(CANVAS_WIDTH)}" height="${formatSvgNumber(CANVAS_HEIGHT)}" fill="${PALETTE.background}" opacity="${formatSvgNumber(VEIL_OPACITY)}"/>` +
    expandingRing({
      cx: CENTER_X,
      cy: SCENE_CENTER_Y,
      beginSeconds,
      fromRadius: 18,
      toRadius: 92,
      strokeColor: PALETTE.orbitIndigo,
      strokeWidth: 0.5,
      peakOpacity: 0.3,
    }) +
    dimmingEmber(beginSeconds)
  );
}

function dimmingEmber(beginSeconds: number): string {
  return (
    `<circle cx="${formatSvgNumber(CENTER_X)}" cy="${formatSvgNumber(SCENE_CENTER_Y)}" r="2.5" fill="${PALETTE.orbitIndigo}" opacity="0.8">` +
    `<animate attributeName="opacity" begin="${formatSvgNumber(beginSeconds)}s" dur="${formatSvgNumber(EMBER_DIM_SECONDS)}s" values="0.8;0.35" fill="freeze"/>` +
    `</circle>`
  );
}
