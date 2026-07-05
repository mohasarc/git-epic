import { formatSvgNumber } from '../rendering/format-svg-number.js';
import type { MuralScene } from './mural-scene.js';
import { renderRoad } from './layers/road.js';
import { renderSky } from './layers/sky.js';
import { renderTerrain } from './layers/terrain.js';

/**
 * The desert strip's backdrop and spine: sky gradient, distant terrain, per-era
 * ground tints at local origins, and one continuous road at the ribbon-top baseline.
 * No structures, ribbon, or text yet — those layers grow P5→P7.
 */
export function renderMuralSvg(scene: MuralScene): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${formatSvgNumber(scene.width)}" height="${formatSvgNumber(scene.height)}" viewBox="0 0 ${formatSvgNumber(scene.width)} ${formatSvgNumber(scene.height)}" role="img">` +
    renderSky(scene.width) +
    renderTerrain(scene.width, scene.eras) +
    renderRoad(scene.width) +
    `</svg>`
  );
}
