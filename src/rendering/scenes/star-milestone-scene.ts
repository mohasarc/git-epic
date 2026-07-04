import type { ChapterSceneSegment } from '../../timeline/timeline.js';
import { formatSvgNumber } from '../format-svg-number.js';
import { CENTER_X, SCENE_CENTER_Y, sparkGlow } from '../scene-primitives.js';
import { PALETTE } from '../visual-vocabulary.js';

const BURST_RADIUS = 96;
const BURST_SECONDS = 2;
const BURST_BEGIN_OFFSET_SECONDS = 0.3;

export function starMilestoneScene(segment: ChapterSceneSegment): string {
  const chapter = segment.chapter;
  if (chapter.kind !== 'star-milestone') {
    throw new Error(`starMilestoneScene requires a star-milestone chapter, got ${chapter.kind}`);
  }
  return (
    sparkGlow(CENTER_X, SCENE_CENTER_Y, 26) +
    `<circle cx="${formatSvgNumber(CENTER_X)}" cy="${formatSvgNumber(SCENE_CENTER_Y)}" r="3.5" fill="${PALETTE.spark}"/>` +
    radiatingStars(segment.startSeconds + BURST_BEGIN_OFFSET_SECONDS, burstStarCount(chapter.threshold))
  );
}

function burstStarCount(threshold: 100 | 1000 | 10000): number {
  switch (threshold) {
    case 100:
      return 6;
    case 1000:
      return 10;
    case 10000:
      return 14;
  }
}

function radiatingStars(beginSeconds: number, starCount: number): string {
  const begin = `${formatSvgNumber(beginSeconds)}s`;
  const duration = `${formatSvgNumber(BURST_SECONDS)}s`;
  let stars = '';
  for (let starIndex = 0; starIndex < starCount; starIndex += 1) {
    const angle = (Math.PI * 2 * starIndex) / starCount;
    const toX = CENTER_X + Math.cos(angle) * BURST_RADIUS;
    const toY = SCENE_CENTER_Y + Math.sin(angle) * BURST_RADIUS;
    stars +=
      `<circle cx="${formatSvgNumber(CENTER_X)}" cy="${formatSvgNumber(SCENE_CENTER_Y)}" r="1.8" fill="${PALETTE.spark}" opacity="0">` +
      `<animate attributeName="cx" begin="${begin}" dur="${duration}" values="${formatSvgNumber(CENTER_X)};${formatSvgNumber(toX)}" fill="freeze"/>` +
      `<animate attributeName="cy" begin="${begin}" dur="${duration}" values="${formatSvgNumber(SCENE_CENTER_Y)};${formatSvgNumber(toY)}" fill="freeze"/>` +
      `<animate attributeName="opacity" begin="${begin}" dur="${duration}" values="0.9;0.35" fill="freeze"/>` +
      `</circle>`;
  }
  return stars;
}
