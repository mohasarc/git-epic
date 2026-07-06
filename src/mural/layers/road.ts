import { formatSvgNumber } from '../../rendering/format-svg-number.js';
import { Y_BANDS } from '../mural-vocabulary.js';
import type { World } from '../worlds/world.js';

const ROAD_WIDTH = 4;

/**
 * The spine threading the whole strip at the baseline (= ribbon top edge). Desert and
 * mountain draw a road in the world's spine color; river swaps in a water band in P3
 * (dispatched on world.spine.kind then).
 */
export function renderRoad(width: number, world: World): string {
  const baseline = formatSvgNumber(Y_BANDS.roadBaseline);
  const span = formatSvgNumber(width);
  return `<polyline points="0,${baseline} ${span},${baseline}" fill="none" stroke="${world.spine.color}" stroke-width="${formatSvgNumber(ROAD_WIDTH)}"/>`;
}
