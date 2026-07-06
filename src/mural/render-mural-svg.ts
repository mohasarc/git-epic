import { formatSvgNumber } from '../rendering/format-svg-number.js';
import type { MuralScene } from './mural-scene.js';
import { renderAccessibility } from './layers/accessibility.js';
import { renderBadgeFinale } from './layers/badge-finale.js';
import { renderMotifs } from './layers/motifs.js';
import { renderRibbon } from './layers/ribbon.js';
import { renderRoad } from './layers/road.js';
import { renderSky } from './layers/sky.js';
import { renderStructures } from './layers/structures.js';
import { renderTerrain } from './layers/terrain.js';
import { renderText } from './layers/text.js';
import { desert } from './worlds/desert.js';

/**
 * The desert strip: accessible <title>/<desc>, sky gradient, distant terrain, per-era
 * ground tints at local origins, one continuous road at the ribbon-top baseline,
 * tier-colored structures at world scale, strength motifs over them, the contribution
 * ribbon band below the road, the visible caps titles/subtitle/label, then the present-day
 * badge finale panel topmost.
 */
export function renderMuralSvg(scene: MuralScene): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${formatSvgNumber(scene.width)}" height="${formatSvgNumber(scene.height)}" viewBox="0 0 ${formatSvgNumber(scene.width)} ${formatSvgNumber(scene.height)}" role="img">` +
    renderAccessibility(scene) +
    renderSky(scene.width, desert) +
    renderTerrain(scene.width, scene.eras, desert) +
    renderRoad(scene.width, desert) +
    renderStructures(scene.eras, scene.worldScale, desert) +
    renderMotifs(scene.eras, scene.worldScale, desert) +
    renderRibbon(scene.eras, scene.width, desert) +
    renderText(scene) +
    renderBadgeFinale(scene, desert) +
    `</svg>`
  );
}
