import { formatSvgNumber } from '../../rendering/format-svg-number.js';
import { markerModule } from '../modules/marker.js';
import { propModule } from '../modules/prop.js';
import { structureModule } from '../modules/structure.js';
import { tentModule } from '../modules/tent.js';
import type { MuralSlot, PlacedEra, WorldScale } from '../mural-scene.js';
import { STRUCTURE_FILL, STRUCTURE_HEIGHT, type ModuleFill } from '../mural-vocabulary.js';

const MARKER_HEIGHT: Record<WorldScale, number> = { camp: 34, town: 54, metropolis: 78 };
const PROP_HEIGHT = 16;

/**
 * Fill each era's allocated slots with tier-colored modules standing on the road
 * baseline. World scale drives count (already in the slots) and height; tier drives
 * palette. Small worlds pitch tents; larger worlds raise buildings. No decay module
 * exists — a small scene without a dark-age chapter never shows one (§3.3).
 */
export function renderStructures(eras: PlacedEra[], worldScale: WorldScale): string {
  return eras.map((era) => renderEra(era, worldScale)).join('');
}

function renderEra(era: PlacedEra, worldScale: WorldScale): string {
  const fill = STRUCTURE_FILL[era.tier];
  return era.slots.map((slot) => placeModule(slot, worldScale, fill)).join('');
}

function placeModule(slot: MuralSlot, worldScale: WorldScale, fill: ModuleFill): string {
  const height = moduleHeight(slot.type, worldScale);
  return (
    `<g transform="translate(${formatSvgNumber(slot.x)},${formatSvgNumber(slot.baselineY)}) scale(${formatSvgNumber(slot.width)},${formatSvgNumber(height)})">` +
    moduleBody(slot.type, worldScale, fill) +
    `</g>`
  );
}

function moduleBody(type: MuralSlot['type'], worldScale: WorldScale, fill: ModuleFill): string {
  const opts = { fill, heightScale: 1 };
  if (type === 'marker') return markerModule(opts);
  if (type === 'prop') return propModule(opts);
  return worldScale === 'camp' ? tentModule(opts) : structureModule(opts);
}

function moduleHeight(type: MuralSlot['type'], worldScale: WorldScale): number {
  if (type === 'marker') return MARKER_HEIGHT[worldScale];
  if (type === 'prop') return PROP_HEIGHT;
  return STRUCTURE_HEIGHT[worldScale];
}
