import { describe, expect, it } from 'vitest';
import { packEraRows, rowY } from './pack-era-rows.js';
import type { PlacedEra } from './mural-scene.js';
import { MURAL_HEIGHT, ROW_GAP, STATIC_ROW_WIDTH } from './mural-vocabulary.js';

function placedEra(x: number, width: number, title: string): PlacedEra {
  return {
    chapter: null,
    startDate: '2020-01-01',
    endDate: '2020-06-01',
    tier: 'modern',
    x,
    width,
    slots: [],
    ribbon: [],
    title,
    motifs: [],
  };
}

/** Lay `widths` end to end starting at `startX`, titled by index. */
function laidOut(widths: number[], startX = 0): PlacedEra[] {
  let cursor = startX;
  return widths.map((width, index) => {
    const era = placedEra(cursor, width, `era-${index}`);
    cursor += width;
    return era;
  });
}

describe('packEraRows', () => {
  it('packs eras narrower than one row into a single row', () => {
    const eras = laidOut([200, 200, 200]);
    const rows = packEraRows(eras, STATIC_ROW_WIDTH);
    expect(rows).toHaveLength(1);
    expect(rows[0].eras).toEqual(eras);
    expect(rows[0].index).toBe(0);
  });

  it('greedily breaks a new row at the width boundary, in chapter order', () => {
    const eras = laidOut([250, 250, 250, 250]);
    const rows = packEraRows(eras, STATIC_ROW_WIDTH);
    expect(rows).toHaveLength(2);
    expect(rows[0].eras.map((era) => era.title)).toEqual(['era-0', 'era-1']);
    expect(rows[1].eras.map((era) => era.title)).toEqual(['era-2', 'era-3']);
    expect(rows.map((row) => row.index)).toEqual([0, 1]);
  });

  it('places every input era in exactly one row, order preserved', () => {
    const eras = laidOut([180, 200, 220, 200, 180, 160, 240]);
    const rows = packEraRows(eras, STATIC_ROW_WIDTH);
    const flattened = rows.flatMap((row) => row.eras);
    expect(flattened).toEqual(eras);
  });

  it('gives a single era wider than the row width its own row, never split', () => {
    const eras = laidOut([STATIC_ROW_WIDTH + 100]);
    const rows = packEraRows(eras, STATIC_ROW_WIDTH);
    expect(rows).toHaveLength(1);
    expect(rows[0].eras).toEqual(eras);
  });

  it('records each row span from its first era start to its last era end', () => {
    const eras = laidOut([250, 250, 250]);
    const rows = packEraRows(eras, STATIC_ROW_WIDTH);
    for (const row of rows) {
      const first = row.eras[0];
      const last = row.eras[row.eras.length - 1];
      expect(row.startX).toBe(first.x);
      expect(row.endX).toBe(last.x + last.width);
      expect(row.width).toBe(last.x + last.width - first.x);
    }
  });

  it('is deterministic — same eras yield identical rows', () => {
    const eras = laidOut([250, 250, 250, 250, 250]);
    expect(packEraRows(eras, STATIC_ROW_WIDTH)).toEqual(packEraRows(eras, STATIC_ROW_WIDTH));
  });
});

describe('rowY', () => {
  it('stacks rows one mural height plus a gap apart', () => {
    expect(rowY(1) - rowY(0)).toBe(MURAL_HEIGHT + ROW_GAP);
    expect(rowY(3) - rowY(2)).toBe(MURAL_HEIGHT + ROW_GAP);
  });
});
