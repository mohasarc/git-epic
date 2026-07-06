import { differenceInDays } from '../dates/difference-in-days.js';
import type { ContributionDay } from '../history-snapshot.js';
import type { RibbonColumn } from './mural-scene.js';
import type { ExportRow } from './pack-era-rows.js';
import { RIBBON_MIN_DENSITY, RIBBON_SATURATION_COUNT } from './ribbon-buckets.js';

/** One day's ribbon column before run-length merging; carries its raw count for conservation checks. */
export type ExactRibbonColumn = RibbonColumn & { count: number };

/**
 * The exact per-day activity chart for one export row: one column per day across the row's
 * date span `[firstEra.startDate, lastEra.endDate]`, x mapped time-linearly so every day gets
 * equal width regardless of era pixel width. Density uses the same ramp as the compressed SVG
 * ribbon; every in-span contribution lands in exactly one column, so counts are conserved.
 */
export function exactRibbonColumns(row: ExportRow, contributionDays: ContributionDay[]): ExactRibbonColumn[] {
  const firstEra = row.eras[0];
  const lastEra = row.eras[row.eras.length - 1];
  const spanDays = Math.max(1, differenceInDays(firstEra.startDate, lastEra.endDate));
  const pixelsPerDay = row.width / spanDays;

  const counts = new Array<number>(spanDays).fill(0);
  for (const day of contributionDays) {
    const offset = differenceInDays(firstEra.startDate, day.date);
    if (offset < 0 || offset > spanDays) continue;
    counts[Math.min(spanDays - 1, offset)] += day.count;
  }

  return counts.map((count, offset) => ({
    x: row.startX + offset * pixelsPerDay,
    width: pixelsPerDay,
    density: dayDensity(count),
    count,
  }));
}

/** The row's ribbon as render-ready columns: exact per-day model, adjacent equal-density days merged. */
export function buildExactRibbon(row: ExportRow, contributionDays: ContributionDay[]): RibbonColumn[] {
  const merged: RibbonColumn[] = [];
  for (const { x, width, density } of exactRibbonColumns(row, contributionDays)) {
    const previous = merged[merged.length - 1];
    if (previous && previous.density === density) {
      previous.width += width;
    } else {
      merged.push({ x, width, density });
    }
  }
  return merged;
}

function dayDensity(count: number): number {
  return Math.min(1, Math.max(RIBBON_MIN_DENSITY, count / RIBBON_SATURATION_COUNT));
}
