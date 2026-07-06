import { differenceInDays } from '../dates/difference-in-days.js';
import type { ContributionDay } from '../history-snapshot.js';
import { RIBBON_PITCH } from './mural-vocabulary.js';
import type { EraPlacement } from './era-widths.js';
import type { MuralEra, RibbonColumn } from './mural-scene.js';

/** Daily contribution rate that reads as full saturation. */
export const RIBBON_SATURATION_COUNT = 5;
/** Quiet columns stay visible, never fully empty (§6.6 pale-but-present). */
export const RIBBON_MIN_DENSITY = 0.08;

/**
 * Fixed-pitch columns across the era, each a normalized density of the era's own
 * contribution days. Every era day lands in exactly one column (offset-bucketed, so
 * a day on the closing boundary counts), keeping the ribbon honest.
 */
export function bucketRibbon(
  era: MuralEra,
  placement: EraPlacement,
  eraContributionDays: ContributionDay[],
): RibbonColumn[] {
  const columnCount = Math.max(1, Math.round(placement.width / RIBBON_PITCH));
  const columnWidth = placement.width / columnCount;
  const spanDays = Math.max(1, differenceInDays(era.startDate, era.endDate));

  const columnCounts = new Array<number>(columnCount).fill(0);
  for (const day of eraContributionDays) {
    const offset = differenceInDays(era.startDate, day.date);
    const index = Math.min(columnCount - 1, Math.max(0, Math.floor((offset / spanDays) * columnCount)));
    columnCounts[index] += day.count;
  }

  const daysPerColumn = spanDays / columnCount;
  return columnCounts.map((total, index) => ({
    x: placement.x + index * columnWidth,
    width: columnWidth,
    density: columnDensity(total, daysPerColumn),
  }));
}

function columnDensity(total: number, daysPerColumn: number): number {
  const density = total / (daysPerColumn * RIBBON_SATURATION_COUNT);
  return Math.max(RIBBON_MIN_DENSITY, Math.min(1, density));
}
