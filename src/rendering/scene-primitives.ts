import { escapeXmlText } from './escape-xml-text.js';
import { formatSvgNumber } from './format-svg-number.js';
import { PALETTE, TYPOGRAPHY } from './visual-vocabulary.js';

export const CANVAS_WIDTH = 830;
export const CANVAS_HEIGHT = 415;
export const CENTER_X = CANVAS_WIDTH / 2;

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

export function fadingRule(x: number, y: number, width: number): string {
  return `<rect x="${formatSvgNumber(x)}" y="${formatSvgNumber(y)}" width="${formatSvgNumber(width)}" height="1" fill="url(#rule-fade)"/>`;
}

export function ornamentDot(x: number, y: number): string {
  return `<circle cx="${formatSvgNumber(x)}" cy="${formatSvgNumber(y)}" r="1.8" fill="${PALETTE.gildedDeep}" opacity="0.8"/>`;
}
