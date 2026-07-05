import { formatSvgNumber } from '../../rendering/format-svg-number.js';
import { MURAL_OUTLINE, MURAL_OUTLINE_WIDTH } from '../mural-vocabulary.js';

/** Fixed thin outline, kept thin at any caller scale via non-scaling-stroke. */
const OUTLINE = `stroke="${MURAL_OUTLINE}" stroke-width="${formatSvgNumber(MURAL_OUTLINE_WIDTH)}" vector-effect="non-scaling-stroke"`;

export function outlinedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
): string {
  return `<rect x="${formatSvgNumber(x)}" y="${formatSvgNumber(y)}" width="${formatSvgNumber(width)}" height="${formatSvgNumber(height)}" fill="${fill}" ${OUTLINE}/>`;
}

export function outlinedPolygon(points: readonly [number, number][], fill: string): string {
  const drawn = points.map(([x, y]) => `${formatSvgNumber(x)},${formatSvgNumber(y)}`).join(' ');
  return `<polygon points="${drawn}" fill="${fill}" ${OUTLINE}/>`;
}

export function outlinedCircle(cx: number, cy: number, radius: number, fill: string): string {
  return `<circle cx="${formatSvgNumber(cx)}" cy="${formatSvgNumber(cy)}" r="${formatSvgNumber(radius)}" fill="${fill}" ${OUTLINE}/>`;
}
