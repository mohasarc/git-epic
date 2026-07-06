import { describe, expect, it } from 'vitest';
import type { ContributionDay } from '../history-snapshot.js';
import { addDays } from '../dates/add-days.js';
import { differenceInDays } from '../dates/difference-in-days.js';
import { buildExactRibbon, exactRibbonColumns } from './build-exact-ribbon.js';
import type { ExportRow } from './pack-era-rows.js';
import { RIBBON_MIN_DENSITY, bucketRibbon } from './ribbon-buckets.js';
import type { EraPlacement } from './era-widths.js';
import type { MuralEra, PlacedEra } from './mural-scene.js';

function era(startDate: string, endDate: string, x: number, width: number): PlacedEra {
  return { chapter: null, startDate, endDate, tier: 'modern', x, width, slots: [], ribbon: [], title: 'era', motifs: [] };
}

function rowOf(eras: PlacedEra[]): ExportRow {
  const first = eras[0];
  const last = eras[eras.length - 1];
  const startX = first.x;
  const endX = last.x + last.width;
  return { eras, startX, endX, width: endX - startX, index: 0 };
}

function daysBetween(startDate: string, endDate: string, count: (offset: number) => number): ContributionDay[] {
  const span = differenceInDays(startDate, endDate);
  const days: ContributionDay[] = [];
  for (let offset = 0; offset <= span; offset++) {
    const value = count(offset);
    if (value > 0) days.push({ date: addDays(startDate, offset), count: value });
  }
  return days;
}

describe('exactRibbonColumns (pre-merge model)', () => {
  const row = rowOf([era('2020-01-01', '2020-03-01', 40, 200)]);

  it('conserves total counts — every in-span contribution lands in a column', () => {
    const days = daysBetween('2020-01-01', '2020-03-01', (offset) => (offset % 4 === 0 ? offset % 7 : 0));
    const outside: ContributionDay[] = [
      { date: '2019-12-01', count: 99 },
      { date: '2020-06-01', count: 99 },
    ];
    const merged = [...outside, ...days].sort((left, right) => left.date.localeCompare(right.date));

    const columns = exactRibbonColumns(row, merged);
    const inSpanTotal = days.reduce((sum, day) => sum + day.count, 0);
    expect(columns.reduce((sum, column) => sum + column.count, 0)).toBe(inSpanTotal);
  });

  it('counts a contribution on the closing boundary in the final column', () => {
    const columns = exactRibbonColumns(row, [{ date: '2020-03-01', count: 9 }]);
    expect(columns[columns.length - 1].count).toBe(9);
    expect(columns.slice(0, -1).every((column) => column.count === 0)).toBe(true);
  });

  it('emits one column per span day, far finer than bucketRibbon pixel pitch', () => {
    const longRow = rowOf([era('2020-01-01', '2021-12-31', 0, 200)]);
    const dense = daysBetween('2020-01-01', '2021-12-31', (offset) => (offset % 5) + 1);
    const exact = exactRibbonColumns(longRow, dense);
    const placement: EraPlacement = { x: 0, width: 200 };
    const bucketed = bucketRibbon(longRow.eras[0] as MuralEra, placement, dense);
    expect(exact).toHaveLength(differenceInDays('2020-01-01', '2021-12-31'));
    expect(exact.length).toBeGreaterThan(bucketed.length * 3);
  });
});

describe('buildExactRibbon (time-linear, byte-controlled)', () => {
  it('maps days time-linearly — uniform px per day, ribbon spans the whole row', () => {
    const wide = era('2020-01-01', '2020-01-31', 0, 300);
    const narrow = era('2020-01-31', '2020-03-01', 300, 20);
    const row = rowOf([wide, narrow]);
    const columns = exactRibbonColumns(row, []);

    const widths = new Set(columns.map((column) => column.width));
    expect(widths.size).toBe(1);
    const last = columns[columns.length - 1];
    expect(columns[0].x).toBeCloseTo(row.startX, 6);
    expect(last.x + last.width).toBeCloseTo(row.startX + row.width, 6);
  });

  it('gives equal-day-span eras equal ribbon width regardless of pixel width', () => {
    const wide = era('2020-01-01', '2020-01-31', 0, 300);
    const narrow = era('2020-01-31', '2020-03-01', 300, 20);
    const row = rowOf([wide, narrow]);
    const columns = exactRibbonColumns(row, []);

    const wideBoundary = differenceInDays(wide.startDate, wide.endDate);
    const wideWidth = columns.slice(0, wideBoundary).reduce((sum, column) => sum + column.width, 0);
    const narrowWidth = columns.slice(wideBoundary).reduce((sum, column) => sum + column.width, 0);
    expect(wideWidth).toBeCloseTo(narrowWidth, 6);
  });

  it('collapses an all-quiet span to a single floor band at min density', () => {
    const row = rowOf([era('2020-01-01', '2020-03-01', 0, 200)]);
    const columns = buildExactRibbon(row, []);
    expect(columns).toHaveLength(1);
    expect(columns[0].density).toBe(RIBBON_MIN_DENSITY);
    expect(columns[0].x).toBeCloseTo(0, 6);
    expect(columns[0].width).toBeCloseTo(200, 6);
  });

  it('run-length-merges adjacent equal-density days, preserving span coverage', () => {
    const row = rowOf([era('2020-01-01', '2020-03-01', 0, 200)]);
    const days = daysBetween('2020-01-01', '2020-03-01', (offset) => (offset < 20 ? 3 : 0));
    const columns = buildExactRibbon(row, days);
    expect(columns.length).toBeLessThan(exactRibbonColumns(row, days).length);
    const last = columns[columns.length - 1];
    expect(last.x + last.width).toBeCloseTo(200, 6);
    const densities = new Set(columns.map((column) => column.density));
    expect(densities.size).toBe(2);
  });

  it('is deterministic — same input yields identical columns', () => {
    const row = rowOf([era('2020-01-01', '2020-06-01', 0, 400)]);
    const days = daysBetween('2020-01-01', '2020-06-01', (offset) => offset % 6);
    expect(buildExactRibbon(row, days)).toEqual(buildExactRibbon(row, days));
  });

  it('handles an empty contribution list without crashing', () => {
    const row = rowOf([era('2020-01-01', '2020-01-02', 0, 100)]);
    expect(() => buildExactRibbon(row, [])).not.toThrow();
    expect(buildExactRibbon(row, [])).toHaveLength(1);
  });
});
