import { escapeXmlText } from './escape-xml-text.js';
import { formatSvgNumber } from './format-svg-number.js';
import { PALETTE, STYLE_MOTION, TYPOGRAPHY } from './visual-vocabulary.js';

export const CANVAS_WIDTH = 830;
export const CANVAS_HEIGHT = 415;
export const CENTER_X = CANVAS_WIDTH / 2;
export const SCENE_CENTER_Y = 186;

export type CenteredTextOptions = {
  fontSize: number;
  fill: string;
  fontWeight?: string;
  fontStyle?: string;
  letterSpacing?: number;
};

export function centeredText(
  content: string,
  x: number,
  y: number,
  options: CenteredTextOptions,
): string {
  const fontWeight = options.fontWeight ? ` font-weight="${options.fontWeight}"` : '';
  const fontStyle = options.fontStyle ? ` font-style="${options.fontStyle}"` : '';
  const letterSpacing =
    options.letterSpacing === undefined
      ? ''
      : ` letter-spacing="${formatSvgNumber(options.letterSpacing)}"`;
  return (
    `<text x="${formatSvgNumber(x)}" y="${formatSvgNumber(y)}" text-anchor="middle" font-family="${TYPOGRAPHY.fontStack}" font-size="${formatSvgNumber(options.fontSize)}" fill="${options.fill}"${fontWeight}${fontStyle}${letterSpacing}>` +
    escapeXmlText(content) +
    `</text>`
  );
}

export function sparkGlow(x: number, y: number, radius: number): string {
  return `<circle cx="${formatSvgNumber(x)}" cy="${formatSvgNumber(y)}" r="${formatSvgNumber(radius)}" fill="url(#spark-glow)"/>`;
}

export function fadingRule(x: number, y: number, width: number): string {
  return `<rect x="${formatSvgNumber(x)}" y="${formatSvgNumber(y)}" width="${formatSvgNumber(width)}" height="1" fill="url(#rule-fade)"/>`;
}

export function ornamentDot(x: number, y: number): string {
  return `<circle cx="${formatSvgNumber(x)}" cy="${formatSvgNumber(y)}" r="1.8" fill="${PALETTE.gildedDeep}" opacity="0.8"/>`;
}

export type ExpandingRingOptions = {
  cx: number;
  cy: number;
  beginSeconds: number;
  fromRadius: number;
  toRadius: number;
  strokeColor: string;
  strokeWidth: number;
  peakOpacity: number;
};

export function expandingRing(options: ExpandingRingOptions): string {
  const begin = `${formatSvgNumber(options.beginSeconds)}s`;
  const duration = `${formatSvgNumber(STYLE_MOTION.ringExpansionSeconds)}s`;
  return (
    `<circle cx="${formatSvgNumber(options.cx)}" cy="${formatSvgNumber(options.cy)}" r="${formatSvgNumber(options.toRadius)}" fill="none" stroke="${options.strokeColor}" stroke-width="${formatSvgNumber(options.strokeWidth)}" opacity="0">` +
    `<animate attributeName="r" begin="${begin}" dur="${duration}" values="${formatSvgNumber(options.fromRadius)};${formatSvgNumber(options.toRadius)}" fill="freeze"/>` +
    `<animate attributeName="opacity" begin="${begin}" dur="${duration}" values="${formatSvgNumber(options.peakOpacity)};0.05" fill="freeze"/>` +
    `</circle>`
  );
}
