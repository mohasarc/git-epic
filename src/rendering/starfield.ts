import { formatSvgNumber } from './format-svg-number.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './scene-primitives.js';
import { PALETTE, STYLE_MOTION } from './visual-vocabulary.js';

const BACKDROP_STAR_COUNT = 110;

export function renderBackdropStarfield(random: () => number): string {
  let stars = '';
  for (let starIndex = 0; starIndex < BACKDROP_STAR_COUNT; starIndex += 1) {
    const x = random() * CANVAS_WIDTH;
    const y = random() * CANVAS_HEIGHT;
    const radius = 0.4 + random() * 1.1;
    const opacity = 0.1 + random() * 0.45;
    stars += `<circle cx="${formatSvgNumber(x)}" cy="${formatSvgNumber(y)}" r="${formatSvgNumber(radius)}" fill="${PALETTE.starlight}" opacity="${formatSvgNumber(opacity)}"/>`;
  }
  return `<g>${stars}</g>`;
}

export function renderTwinklingStars(
  begin: string,
  twinkleStarCount: number,
  random: () => number,
): string {
  let stars = '';
  for (let starIndex = 0; starIndex < twinkleStarCount; starIndex += 1) {
    const x = random() * CANVAS_WIDTH;
    const y = random() * CANVAS_HEIGHT;
    const duration = STYLE_MOTION.twinklePeriodSeconds + random() * 4;
    stars +=
      `<circle cx="${formatSvgNumber(x)}" cy="${formatSvgNumber(y)}" r="${formatSvgNumber(1.4)}" fill="${PALETTE.starlight}" opacity="0.2">` +
      `<animate attributeName="opacity" begin="${begin}" dur="${formatSvgNumber(duration)}s" values="0.2;0.8;0.2" repeatCount="indefinite"/>` +
      `</circle>`;
  }
  return stars;
}
