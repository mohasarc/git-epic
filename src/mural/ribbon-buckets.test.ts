import { describe, expect, it } from 'vitest';
import type { ContributionDay } from '../history-snapshot.js';
import { addDays } from '../dates/add-days.js';
import { RIBBON_PITCH } from './mural-vocabulary.js';
import type { EraPlacement } from './era-widths.js';
import type { MuralEra } from './mural-scene.js';
import { bucketRibbon } from './ribbon-buckets.js';

const ERA: MuralEra = {
  chapter: null,
  startDate: '2020-01-01',
  endDate: '2020-12-31',
  tier: 'modern',
};
const PLACEMENT: EraPlacement = { x: 40, width: 200 };

function boomDays(): ContributionDay[] {
  return Array.from({ length: 300 }, (_unused, offset) => ({
    date: addDays(ERA.startDate, offset),
    count: 8,
  }));
}

function quietDays(): ContributionDay[] {
  return [
    { date: '2020-02-01', count: 1 },
    { date: '2020-07-01', count: 1 },
  ];
}

describe('bucketRibbon geometry', () => {
  it('emits round(eraWidth / RIBBON_PITCH) contiguous columns spanning the era width', () => {
    const columns = bucketRibbon(ERA, PLACEMENT, boomDays());
    expect(columns).toHaveLength(Math.round(PLACEMENT.width / RIBBON_PITCH));
    expect(columns[0].x).toBeCloseTo(PLACEMENT.x, 6);
    const last = columns[columns.length - 1];
    expect(last.x + last.width).toBeCloseTo(PLACEMENT.x + PLACEMENT.width, 6);
    for (let index = 0; index + 1 < columns.length; index++) {
      expect(columns[index].x + columns[index].width).toBeCloseTo(columns[index + 1].x, 6);
    }
  });

  it('saturates a boom era and keeps a quiet era pale but present', () => {
    const boom = bucketRibbon(ERA, PLACEMENT, boomDays());
    const quiet = bucketRibbon(ERA, PLACEMENT, quietDays());
    expect(Math.max(...boom.map((column) => column.density))).toBeGreaterThan(0.5);
    for (const column of quiet) {
      expect(column.density).toBeGreaterThan(0);
    }
    expect(Math.max(...quiet.map((column) => column.density))).toBeLessThan(
      Math.max(...boom.map((column) => column.density)),
    );
  });

  it('counts a day on the closing boundary in the final column', () => {
    const columns = bucketRibbon(ERA, PLACEMENT, [{ date: ERA.endDate, count: 9 }]);
    const last = columns[columns.length - 1];
    expect(last.density).toBeGreaterThan(columns[0].density);
  });
});
