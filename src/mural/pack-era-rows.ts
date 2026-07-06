import type { PlacedEra } from './mural-scene.js';
import { HEADER_HEIGHT, MURAL_HEIGHT, ROW_GAP } from './mural-vocabulary.js';

/** A full-width band of the static export holding one or more whole eras. */
export type ExportRow = {
  eras: PlacedEra[];
  startX: number;
  endX: number;
  width: number;
  index: number;
};

/**
 * Greedily wrap chapter-ordered eras into rows no wider than `rowWidth`. An era is the
 * atomic wrap unit — a started row keeps taking eras while it fits, then closes; a fresh
 * empty row always accepts the next era, so an era wider than `rowWidth` gets its own row
 * rather than being split or dropped.
 */
export function packEraRows(eras: PlacedEra[], rowWidth: number): ExportRow[] {
  const rows: ExportRow[] = [];
  let current: PlacedEra[] = [];
  let runningWidth = 0;

  for (const era of eras) {
    if (current.length > 0 && runningWidth + era.width > rowWidth) {
      rows.push(closeRow(current, rows.length));
      current = [];
      runningWidth = 0;
    }
    current.push(era);
    runningWidth += era.width;
  }
  if (current.length > 0) rows.push(closeRow(current, rows.length));

  return rows;
}

function closeRow(eras: PlacedEra[], index: number): ExportRow {
  const first = eras[0];
  const last = eras[eras.length - 1];
  const startX = first.x;
  const endX = last.x + last.width;
  return { eras, startX, endX, width: endX - startX, index };
}

/** Top y of the row band at `index`, below the header, stacked with a gap between rows. */
export function rowY(index: number): number {
  return HEADER_HEIGHT + index * (MURAL_HEIGHT + ROW_GAP);
}
