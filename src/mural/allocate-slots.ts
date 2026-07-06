import { Y_BANDS } from './mural-vocabulary.js';
import type { EraPlacement } from './era-widths.js';
import type { MuralSlot, WorldScale } from './mural-scene.js';

const BASE_SLOT_COUNT: Record<WorldScale, number> = { camp: 2, town: 4, metropolis: 6 };
const MAX_SLOT_COUNT: Record<WorldScale, number> = { camp: 3, town: 6, metropolis: 9 };

/** One extra slot per this many contributions in the era, up to the world-scale cap. */
const SLOT_ACTIVITY_PITCH = 40;
const SLOT_INNER_PAD = 6;
/** Slot fills this share of its cell, leaving a gap so allocation never overlaps. */
const SLOT_FILL_RATIO = 0.7;

/** Repeating type pattern; a structure leads so every era grace-floors to one. */
const SLOT_TYPE_CYCLE: MuralSlot['type'][] = ['structure', 'marker', 'structure', 'prop'];

/**
 * Left-to-right slot allocation inside the era's X span. Count grows with world
 * scale and the era's own activity; geometry is purely a function of the placement,
 * never a seed — cosmetic module choice and jitter are the render layer's job.
 */
export function allocateSlots(
  placement: EraPlacement,
  worldScale: WorldScale,
  eraContributionCount: number,
): MuralSlot[] {
  const count = slotCount(worldScale, eraContributionCount);
  const usableWidth = Math.max(0, placement.width - SLOT_INNER_PAD * 2);
  const cellWidth = usableWidth / count;

  const slots: MuralSlot[] = [];
  for (let index = 0; index < count; index++) {
    slots.push({
      x: placement.x + SLOT_INNER_PAD + index * cellWidth,
      width: cellWidth * SLOT_FILL_RATIO,
      baselineY: Y_BANDS.roadBaseline,
      type: SLOT_TYPE_CYCLE[index % SLOT_TYPE_CYCLE.length],
    });
  }
  return slots;
}

function slotCount(worldScale: WorldScale, eraContributionCount: number): number {
  const bonus = Math.round(eraContributionCount / SLOT_ACTIVITY_PITCH);
  return Math.min(MAX_SLOT_COUNT[worldScale], BASE_SLOT_COUNT[worldScale] + bonus);
}
