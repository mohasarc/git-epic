import type { ChapterSceneSegment } from '../../timeline/timeline.js';
import { formatSvgNumber } from '../format-svg-number.js';
import { CENTER_X, SCENE_CENTER_Y, sparkGlow } from '../scene-primitives.js';
import { PALETTE } from '../visual-vocabulary.js';

const SPARK_COUNT = 8;
const INNER_RING_RADIUS = 16;
const OUTER_RING_RADIUS = 66;
const BLOOM_SECONDS = 1.1;
const BLOOM_STAGGER_SECONDS = 0.22;

export function prolificacyScene(segment: ChapterSceneSegment): string {
  return (
    sparkGlow(CENTER_X, SCENE_CENTER_Y, 24) +
    `<circle cx="${formatSvgNumber(CENTER_X)}" cy="${formatSvgNumber(SCENE_CENTER_Y)}" r="3" fill="${PALETTE.spark}"/>` +
    bloomingSparks(segment.startSeconds + 0.2)
  );
}

function bloomingSparks(firstBeginSeconds: number): string {
  const duration = `${formatSvgNumber(BLOOM_SECONDS)}s`;
  let sparks = '';
  for (let sparkIndex = 0; sparkIndex < SPARK_COUNT; sparkIndex += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * sparkIndex) / SPARK_COUNT;
    const fromX = CENTER_X + Math.cos(angle) * INNER_RING_RADIUS;
    const fromY = SCENE_CENTER_Y + Math.sin(angle) * INNER_RING_RADIUS;
    const toX = CENTER_X + Math.cos(angle) * OUTER_RING_RADIUS;
    const toY = SCENE_CENTER_Y + Math.sin(angle) * OUTER_RING_RADIUS;
    const begin = `${formatSvgNumber(firstBeginSeconds + sparkIndex * BLOOM_STAGGER_SECONDS)}s`;
    sparks +=
      `<circle cx="${formatSvgNumber(fromX)}" cy="${formatSvgNumber(fromY)}" r="2" fill="${PALETTE.spark}" opacity="0">` +
      `<animate attributeName="cx" begin="${begin}" dur="${duration}" values="${formatSvgNumber(fromX)};${formatSvgNumber(toX)}" fill="freeze"/>` +
      `<animate attributeName="cy" begin="${begin}" dur="${duration}" values="${formatSvgNumber(fromY)};${formatSvgNumber(toY)}" fill="freeze"/>` +
      `<animate attributeName="opacity" begin="${begin}" dur="${duration}" values="0;0.85" fill="freeze"/>` +
      `</circle>`;
  }
  return sparks;
}
