import { formatSvgNumber } from '../../rendering/format-svg-number.js';
import type { PlacedEra, RibbonColumn } from '../mural-scene.js';
import { MURAL_OUTLINE, MURAL_TYPOGRAPHY, RIBBON_RAMP, Y_BANDS } from '../mural-vocabulary.js';

export const RIBBON_LEGEND_LOW = 'Less activity';
export const RIBBON_LEGEND_HIGH = 'More activity';

const RIBBON_BAND_HEIGHT = Y_BANDS.ribbonBottom - Y_BANDS.roadBaseline;
const LEGEND_Y = 348;
const LEGEND_SWATCH = 8;
const LEGEND_GAP = 3;

/** Ramp step for a column density (0..1); pale-but-present at the low end. */
export function ribbonColumnColor(density: number): string {
  const index = Math.min(RIBBON_RAMP.length - 1, Math.max(0, Math.floor(density * RIBBON_RAMP.length)));
  return RIBBON_RAMP[index];
}

/**
 * The contribution ribbon: one warm-ramp column per scene RibbonColumn growing up from
 * the ribbon bottom, reading as one continuous band across eras, plus the density legend.
 * Column color and height come straight from the per-era density — no faked columns.
 */
export function renderRibbon(eras: PlacedEra[], stripWidth: number): string {
  const columns = eras.flatMap((era) => era.ribbon.map(renderColumn)).join('');
  return columns + renderLegend(stripWidth);
}

function renderColumn(column: RibbonColumn): string {
  const height = Number(formatSvgNumber(column.density * RIBBON_BAND_HEIGHT));
  const y = Y_BANDS.ribbonBottom - height;
  return `<rect x="${formatSvgNumber(column.x)}" y="${formatSvgNumber(y)}" width="${formatSvgNumber(column.width)}" height="${formatSvgNumber(height)}" fill="${ribbonColumnColor(column.density)}"/>`;
}

function renderLegend(stripWidth: number): string {
  const swatchesWidth = RIBBON_RAMP.length * (LEGEND_SWATCH + LEGEND_GAP) - LEGEND_GAP;
  const swatchesStart = stripWidth - 24 - swatchesWidth - measureLabelWidth(RIBBON_LEGEND_HIGH);
  const lowX = swatchesStart - LEGEND_GAP;
  const swatches = RIBBON_RAMP.map((color, index) => {
    const x = swatchesStart + index * (LEGEND_SWATCH + LEGEND_GAP);
    return `<rect x="${formatSvgNumber(x)}" y="${formatSvgNumber(LEGEND_Y - LEGEND_SWATCH)}" width="${LEGEND_SWATCH}" height="${LEGEND_SWATCH}" fill="${color}"/>`;
  }).join('');
  const highX = swatchesStart + swatchesWidth + LEGEND_GAP;
  return (
    swatches +
    legendText(lowX, 'end', RIBBON_LEGEND_LOW) +
    legendText(highX, 'start', RIBBON_LEGEND_HIGH)
  );
}

function legendText(x: number, anchor: 'start' | 'end', label: string): string {
  return `<text x="${formatSvgNumber(x)}" y="${formatSvgNumber(LEGEND_Y)}" font-family="${MURAL_TYPOGRAPHY.fontStack}" font-size="9" fill="${MURAL_OUTLINE}" text-anchor="${anchor}">${label}</text>`;
}

function measureLabelWidth(label: string): number {
  return label.length * 5;
}
