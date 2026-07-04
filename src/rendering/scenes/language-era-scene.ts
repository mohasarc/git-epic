import { formatSvgNumber } from '../format-svg-number.js';
import { CENTER_X, SCENE_CENTER_Y, sparkGlow } from '../scene-primitives.js';
import { PALETTE } from '../visual-vocabulary.js';
import type { ChapterSceneSegment } from '../../timeline/timeline.js';

const BODY_OFFSET_X = 58;
const RISE_DISTANCE = 34;
const HANDOVER_SECONDS = 2.2;
const HANDOVER_BEGIN_OFFSET_SECONDS = 0.3;

export function languageEraScene(segment: ChapterSceneSegment): string {
  const beginSeconds = segment.startSeconds + HANDOVER_BEGIN_OFFSET_SECONDS;
  return sparkGlow(CENTER_X, SCENE_CENTER_Y, 22) + fadingBody(beginSeconds) + risingBody(beginSeconds);
}

function fadingBody(beginSeconds: number): string {
  const x = CENTER_X - BODY_OFFSET_X;
  return (
    `<circle cx="${formatSvgNumber(x)}" cy="${formatSvgNumber(SCENE_CENTER_Y)}" r="4.5" fill="${PALETTE.orbitIndigo}" opacity="0.9">` +
    `<animate attributeName="opacity" begin="${formatSvgNumber(beginSeconds)}s" dur="${formatSvgNumber(HANDOVER_SECONDS)}s" values="0.9;0.15" fill="freeze"/>` +
    `</circle>`
  );
}

function risingBody(beginSeconds: number): string {
  const x = CENTER_X + BODY_OFFSET_X;
  const startY = SCENE_CENTER_Y + RISE_DISTANCE / 2;
  return (
    `<g>` +
    `<circle cx="${formatSvgNumber(x)}" cy="${formatSvgNumber(startY)}" r="4.5" fill="${PALETTE.orbitBlue}" opacity="0.15">` +
    `<animate attributeName="opacity" begin="${formatSvgNumber(beginSeconds)}s" dur="${formatSvgNumber(HANDOVER_SECONDS)}s" values="0.15;0.9" fill="freeze"/>` +
    `</circle>` +
    `<animateTransform attributeName="transform" type="translate" begin="${formatSvgNumber(beginSeconds)}s" dur="${formatSvgNumber(HANDOVER_SECONDS)}s" from="0 0" to="0 ${formatSvgNumber(-RISE_DISTANCE)}" fill="freeze"/>` +
    `</g>`
  );
}
