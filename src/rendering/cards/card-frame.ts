import { formatSvgNumber } from '../format-svg-number.js';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CENTER_X,
  centeredText,
  fadingRule,
  ornamentDot,
} from '../scene-primitives.js';
import { createSeededRandom } from '../seeded-random.js';
import { renderBackdropStarfield, renderTwinklingStars } from '../starfield.js';
import { renderUniverseGradients } from '../svg-gradients.js';
import { CREDIT_LINE } from '../../timeline/attribution.js';
import { PALETTE } from '../visual-vocabulary.js';

const CARD_TWINKLE_STAR_COUNT = 44;

export type CardCopy = {
  seed: number;
  primaryLine: string;
  secondaryLine: string;
};

/** Static ambient card in the epic's universe: starfield twinkle, a headline, a caption, the credit line. */
export function renderCard(copy: CardCopy): string {
  const random = createSeededRandom(copy.seed);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${formatSvgNumber(CANVAS_WIDTH)}" height="${formatSvgNumber(CANVAS_HEIGHT)}" viewBox="0 0 ${formatSvgNumber(CANVAS_WIDTH)} ${formatSvgNumber(CANVAS_HEIGHT)}" role="img">` +
    renderUniverseGradients() +
    `<rect width="${formatSvgNumber(CANVAS_WIDTH)}" height="${formatSvgNumber(CANVAS_HEIGHT)}" fill="${PALETTE.background}"/>` +
    `<ellipse cx="${formatSvgNumber(CENTER_X)}" cy="196" rx="300" ry="130" fill="url(#nebula)" opacity="0.7"/>` +
    renderBackdropStarfield(random) +
    renderTwinklingStars('0s', CARD_TWINKLE_STAR_COUNT, random) +
    centeredText(copy.primaryLine, CENTER_X, 196, {
      fontSize: 30,
      fill: 'url(#gilded)',
      fontWeight: 'bold',
      letterSpacing: 3,
    }) +
    fadingRule(CENTER_X - 130, 218, 260) +
    caption(copy.secondaryLine, 250) +
    centeredText(CREDIT_LINE, CENTER_X, 391, { fontSize: 13, fill: PALETTE.dimText }) +
    `</svg>`
  );
}

function caption(text: string, y: number): string {
  return (
    fadingRule(30, y - 5, 55) +
    fadingRule(CANVAS_WIDTH - 85, y - 5, 55) +
    ornamentDot(95, y - 4.5) +
    ornamentDot(CANVAS_WIDTH - 95, y - 4.5) +
    centeredText(text, CENTER_X, y, {
      fontSize: 15.5,
      fill: 'url(#gilded)',
      fontStyle: 'italic',
      letterSpacing: 0.5,
    })
  );
}
