import { formatSvgNumber } from '../../rendering/format-svg-number.js';
import { Y_BANDS } from '../mural-vocabulary.js';
import type { World } from '../worlds/world.js';

const ROAD_WIDTH = 4;
const WATER_BAND_HEIGHT = 10;
const FLOW_STROKE_WIDTH = 2;
const FLOW_DASH = '12 8';
const FLOW_PERIOD = 20;
const FLOW_SECONDS = 3;

/**
 * The spine threading the whole strip at the baseline (= ribbon top edge). Desert and mountain
 * draw a road; river swaps in a water band whose bottom edge holds the ribbon-top baseline.
 */
export function renderRoad(width: number, world: World): string {
  if (world.spine.kind === 'river') return renderWaterBand(width, world);
  return renderRoadLine(width, world);
}

function renderRoadLine(width: number, world: World): string {
  const baseline = formatSvgNumber(Y_BANDS.roadBaseline);
  const span = formatSvgNumber(width);
  return `<polyline points="0,${baseline} ${span},${baseline}" fill="none" stroke="${world.spine.color}" stroke-width="${formatSvgNumber(ROAD_WIDTH)}"/>`;
}

function renderWaterBand(width: number, world: World): string {
  const top = formatSvgNumber(Y_BANDS.roadBaseline - WATER_BAND_HEIGHT);
  return `<rect x="0" y="${top}" width="${formatSvgNumber(width)}" height="${formatSvgNumber(WATER_BAND_HEIGHT)}" fill="${world.spine.color}"/>`;
}

/**
 * The river's world-level flow gesture: a drifting current line along the waterline, looped
 * forever. Owned by the spine layer, sibling to the motif ambient loops — emitted only on the
 * animated path, empty for road spines. Water that doesn't move reads broken.
 */
export function renderSpineFlow(width: number, world: World): string {
  if (world.spine.kind !== 'river') return '';
  const y = formatSvgNumber(Y_BANDS.roadBaseline - WATER_BAND_HEIGHT / 2);
  const highlight = world.spine.highlight ?? world.spine.color;
  return (
    `<line x1="0" y1="${y}" x2="${formatSvgNumber(width)}" y2="${y}" stroke="${highlight}" ` +
    `stroke-width="${formatSvgNumber(FLOW_STROKE_WIDTH)}" stroke-dasharray="${FLOW_DASH}">` +
    `<animate attributeName="stroke-dashoffset" values="0;${formatSvgNumber(-FLOW_PERIOD)}" ` +
    `dur="${formatSvgNumber(FLOW_SECONDS)}s" repeatCount="indefinite"/>` +
    `</line>`
  );
}
