import type { ChapterSceneSegment } from '../../timeline/timeline.js';
import { formatSvgNumber } from '../format-svg-number.js';
import { CENTER_X, SCENE_CENTER_Y, sparkGlow } from '../scene-primitives.js';
import { PALETTE } from '../visual-vocabulary.js';

const TRAVERSE_SECONDS = 2.5;
const TRAVERSE_BEGIN_OFFSET_SECONDS = 0.2;
const TRAVEL_X = 440;
const TRAVEL_Y = -64;
const TRAIL_SPARK_COUNT = 4;
const TRAIL_SPACING = 13;

export function greatStreakScene(segment: ChapterSceneSegment): string {
  const beginSeconds = segment.startSeconds + TRAVERSE_BEGIN_OFFSET_SECONDS;
  const headX = CENTER_X - TRAVEL_X / 2;
  const headY = SCENE_CENTER_Y + -TRAVEL_Y / 2;
  return (
    `<g>` +
    trailSparks(headX, headY) +
    sparkGlow(headX, headY, 16) +
    `<circle cx="${formatSvgNumber(headX)}" cy="${formatSvgNumber(headY)}" r="3.5" fill="${PALETTE.spark}"/>` +
    `<animateTransform attributeName="transform" type="translate" begin="${formatSvgNumber(beginSeconds)}s" dur="${formatSvgNumber(TRAVERSE_SECONDS)}s" from="0 0" to="${formatSvgNumber(TRAVEL_X)} ${formatSvgNumber(TRAVEL_Y)}" fill="freeze"/>` +
    `</g>`
  );
}

function trailSparks(headX: number, headY: number): string {
  const travelLength = Math.hypot(TRAVEL_X, TRAVEL_Y);
  const backwardX = -TRAVEL_X / travelLength;
  const backwardY = -TRAVEL_Y / travelLength;
  let sparks = '';
  for (let sparkIndex = 1; sparkIndex <= TRAIL_SPARK_COUNT; sparkIndex += 1) {
    const x = headX + backwardX * TRAIL_SPACING * sparkIndex;
    const y = headY + backwardY * TRAIL_SPACING * sparkIndex;
    const radius = 2.4 - sparkIndex * 0.4;
    const opacity = 0.75 - sparkIndex * 0.15;
    sparks += `<circle cx="${formatSvgNumber(x)}" cy="${formatSvgNumber(y)}" r="${formatSvgNumber(radius)}" fill="${PALETTE.sparkWarm}" opacity="${formatSvgNumber(opacity)}"/>`;
  }
  return sparks;
}
