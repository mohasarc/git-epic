import { formatSvgNumber } from '../../rendering/format-svg-number.js';
import type { PlacedEra } from '../mural-scene.js';
import { SEAM_FEATHER_WIDTH, Y_BANDS } from '../mural-vocabulary.js';
import type { World } from '../worlds/world.js';

/** Distant horizon band (full width) plus each era's ground tint at its local origin. */
export function renderTerrain(width: number, eras: PlacedEra[], world: World): string {
  return renderDistantBand(width, world) + renderEraGround(width, eras, world);
}

/** Pure backdrop: the distant horizon rect spanning the full strip width. */
export function renderDistantBand(width: number, world: World): string {
  const y = Y_BANDS.skyBottom;
  const height = Y_BANDS.horizonBottom - Y_BANDS.skyBottom;
  return `<rect x="0" y="${formatSvgNumber(y)}" width="${formatSvgNumber(width)}" height="${formatSvgNumber(height)}" fill="${world.distantTerrain}"/>`;
}

/**
 * Per-era flat ground fill under local origins; each rect overruns into its neighbor so
 * seams never gap. The edge eras reach the strip margins so the whole band covers 0→W.
 */
export function renderEraGround(width: number, eras: PlacedEra[], world: World): string {
  const y = Y_BANDS.horizonBottom;
  const height = Y_BANDS.roadBaseline - Y_BANDS.horizonBottom;
  return eras
    .map((era, index) => {
      const startX = index === 0 ? 0 : era.x;
      const endX = index === eras.length - 1 ? width : era.x + era.width + SEAM_FEATHER_WIDTH;
      return (
        `<g transform="translate(${formatSvgNumber(era.x)},0)">` +
        `<rect x="${formatSvgNumber(startX - era.x)}" y="${formatSvgNumber(y)}" width="${formatSvgNumber(endX - startX)}" height="${formatSvgNumber(height)}" fill="${world.groundTint[era.tier]}"/>` +
        `</g>`
      );
    })
    .join('');
}
