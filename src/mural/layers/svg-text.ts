import { escapeXmlText } from '../../rendering/escape-xml-text.js';
import { formatSvgNumber } from '../../rendering/format-svg-number.js';
import { MURAL_OUTLINE, MURAL_TYPOGRAPHY } from '../mural-vocabulary.js';

export type SvgTextOptions = {
  fontSize: number;
  anchor: 'start' | 'middle';
  fontWeight?: 'bold';
  letterSpacing: number;
};

/** Escaped `<text>` emitter shared by the strip text, motif plaques, and badge finale. */
export function svgText(content: string, x: number, y: number, options: SvgTextOptions): string {
  const fontWeight = options.fontWeight ? ` font-weight="${options.fontWeight}"` : '';
  return (
    `<text x="${formatSvgNumber(x)}" y="${formatSvgNumber(y)}" font-family="${MURAL_TYPOGRAPHY.fontStack}" font-size="${formatSvgNumber(options.fontSize)}" fill="${MURAL_OUTLINE}" text-anchor="${options.anchor}" letter-spacing="${formatSvgNumber(options.letterSpacing)}"${fontWeight}>` +
    escapeXmlText(content) +
    `</text>`
  );
}
