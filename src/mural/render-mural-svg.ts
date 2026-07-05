import { formatSvgNumber } from '../rendering/format-svg-number.js';
import type { MuralScene } from './mural-scene.js';
import { renderRibbon } from './layers/ribbon.js';
import { renderRoad } from './layers/road.js';
import { renderSky } from './layers/sky.js';
import { renderStructures } from './layers/structures.js';
import { renderTerrain } from './layers/terrain.js';

/**
 * The desert strip: sky gradient, distant terrain, per-era ground tints at local
 * origins, one continuous road at the ribbon-top baseline, tier-colored structures
 * at world scale, then the contribution ribbon band below the road. No text yet — that
 * layer grows in P7.
 */
export function renderMuralSvg(scene: MuralScene): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${formatSvgNumber(scene.width)}" height="${formatSvgNumber(scene.height)}" viewBox="0 0 ${formatSvgNumber(scene.width)} ${formatSvgNumber(scene.height)}" role="img">` +
    renderSky(scene.width) +
    renderTerrain(scene.width, scene.eras) +
    renderRoad(scene.width) +
    renderStructures(scene.eras, scene.worldScale) +
    renderRibbon(scene.eras, scene.width) +
    `</svg>`
  );
}
