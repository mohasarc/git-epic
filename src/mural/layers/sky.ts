import { formatSvgNumber } from '../../rendering/format-svg-number.js';
import { SKY_GRADIENT_STOPS, Y_BANDS } from '../mural-vocabulary.js';

/** The only gradient in the mural (§6.9); every other fill is flat. */
export const SKY_GRADIENT_ID = 'mural-sky';

export function renderSky(width: number): string {
  const stops = SKY_GRADIENT_STOPS.map(
    (stop) => `<stop offset="${formatSvgNumber(stop.offset * 100)}%" stop-color="${stop.color}"/>`,
  ).join('');
  return (
    `<defs><linearGradient id="${SKY_GRADIENT_ID}" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient></defs>` +
    `<rect x="0" y="0" width="${formatSvgNumber(width)}" height="${formatSvgNumber(Y_BANDS.skyBottom)}" fill="url(#${SKY_GRADIENT_ID})"/>`
  );
}
