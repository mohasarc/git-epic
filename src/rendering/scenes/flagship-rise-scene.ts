import type { ChapterSceneSegment } from '../../timeline/timeline.js';
import { formatSvgNumber } from '../format-svg-number.js';
import { CENTER_X, SCENE_CENTER_Y, sparkGlow } from '../scene-primitives.js';
import { PALETTE } from '../visual-vocabulary.js';

const RISE_DISTANCE = 46;
const RISE_SECONDS = 2.4;
const CONVERGING_STAR_COUNT = 6;
const CONVERGENCE_FROM_RADIUS = 118;
const CONVERGENCE_TO_RADIUS = 16;
const CONVERGENCE_SECONDS = 1.6;
const CONVERGENCE_STAGGER_SECONDS = 0.1;

export function flagshipRiseScene(segment: ChapterSceneSegment): string {
  const riseBeginSeconds = segment.startSeconds + 0.2;
  return ascendingBody(riseBeginSeconds) + convergingStars(riseBeginSeconds + 0.4);
}

function ascendingBody(beginSeconds: number): string {
  const startY = SCENE_CENTER_Y + RISE_DISTANCE / 2;
  return (
    `<g>` +
    sparkGlow(CENTER_X, startY, 30) +
    `<circle cx="${formatSvgNumber(CENTER_X)}" cy="${formatSvgNumber(startY)}" r="4.5" fill="${PALETTE.spark}"/>` +
    `<animateTransform attributeName="transform" type="translate" begin="${formatSvgNumber(beginSeconds)}s" dur="${formatSvgNumber(RISE_SECONDS)}s" from="0 0" to="0 ${formatSvgNumber(-RISE_DISTANCE)}" fill="freeze"/>` +
    `</g>`
  );
}

function convergingStars(beginSeconds: number): string {
  const risenY = SCENE_CENTER_Y - RISE_DISTANCE / 2;
  let stars = '';
  for (let starIndex = 0; starIndex < CONVERGING_STAR_COUNT; starIndex += 1) {
    const angle = (Math.PI * 2 * starIndex) / CONVERGING_STAR_COUNT;
    const fromX = CENTER_X + Math.cos(angle) * CONVERGENCE_FROM_RADIUS;
    const fromY = risenY + Math.sin(angle) * CONVERGENCE_FROM_RADIUS;
    const toX = CENTER_X + Math.cos(angle) * CONVERGENCE_TO_RADIUS;
    const toY = risenY + Math.sin(angle) * CONVERGENCE_TO_RADIUS;
    const begin = `${formatSvgNumber(beginSeconds + starIndex * CONVERGENCE_STAGGER_SECONDS)}s`;
    const duration = `${formatSvgNumber(CONVERGENCE_SECONDS)}s`;
    stars +=
      `<circle cx="${formatSvgNumber(fromX)}" cy="${formatSvgNumber(fromY)}" r="1.7" fill="${PALETTE.spark}" opacity="0.25">` +
      `<animate attributeName="cx" begin="${begin}" dur="${duration}" values="${formatSvgNumber(fromX)};${formatSvgNumber(toX)}" fill="freeze"/>` +
      `<animate attributeName="cy" begin="${begin}" dur="${duration}" values="${formatSvgNumber(fromY)};${formatSvgNumber(toY)}" fill="freeze"/>` +
      `<animate attributeName="opacity" begin="${begin}" dur="${duration}" values="0.25;0.9" fill="freeze"/>` +
      `</circle>`;
  }
  return stars;
}
