import { formatSvgNumber } from '../../rendering/format-svg-number.js';
import { MURAL_PALETTE, Y_BANDS } from '../mural-vocabulary.js';

const ROAD_WIDTH = 4;

/** One continuous road at the baseline (= ribbon top edge), spanning the whole strip. */
export function renderRoad(width: number): string {
  const baseline = formatSvgNumber(Y_BANDS.roadBaseline);
  const span = formatSvgNumber(width);
  return `<polyline points="0,${baseline} ${span},${baseline}" fill="none" stroke="${MURAL_PALETTE.road}" stroke-width="${formatSvgNumber(ROAD_WIDTH)}"/>`;
}
