import { describe, expect, it } from 'vitest';

import type { HistorySnapshot } from '../history-snapshot.js';
import { buildSceneFromSnapshot, renderMuralExport } from '../render-mural.js';
import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { expectEmbedSafeSvg } from '../test-support/expect-embed-safe-svg.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { exactRibbonColumns } from './build-exact-ribbon.js';
import type { ExportRow } from './pack-era-rows.js';
import { packEraRows } from './pack-era-rows.js';
import { STATIC_ROW_WIDTH } from './mural-vocabulary.js';
import { RIBBON_MIN_DENSITY } from './ribbon-buckets.js';
import { WORLD_NAMES } from './worlds/catalog.js';

const RICH_FIXTURE = 'rich-history-account.json';
const DENSE_FIXTURE = 'fifteen-year-overflow.json';
const SINGLE_COMMIT_FIXTURE = 'single-contribution-account.json';

function rows(snapshot: HistorySnapshot): ExportRow[] {
  return packEraRows(buildSceneFromSnapshot(snapshot).eras, STATIC_ROW_WIDTH);
}

function isComplete(svg: string): boolean {
  return svg.startsWith('<svg') && svg.trimEnd().endsWith('</svg>');
}

const zeroActivitySnapshot = buildHistorySnapshot({
  handle: 'unwritten-legend',
  firstPublicActivityDate: null,
  accountCreatedDate: '2026-06-30',
  capturedAtDate: '2026-07-04',
});

describe('static-export done-when suite', () => {
  describe('no motion', () => {
    it('emits no SMIL animation anywhere in the export', () => {
      const svg = renderMuralExport(loadHistorySnapshotFixture(RICH_FIXTURE));
      for (const token of ['<animate', '<animateTransform', '<animateMotion', '<set ', 'dur=', 'calcMode="spline"', 'repeatCount']) {
        expect(svg).not.toContain(token);
      }
    });
  });

  describe('exact activity chart', () => {
    it('conserves every in-span contribution into the row columns', () => {
      const snapshot = loadHistorySnapshotFixture(RICH_FIXTURE);
      for (const row of rows(snapshot)) {
        const start = row.eras[0].startDate;
        const end = row.eras[row.eras.length - 1].endDate;
        const expected = snapshot.contributionDays
          .filter((day) => day.date >= start && day.date <= end)
          .reduce((sum, day) => sum + day.count, 0);
        const actual = exactRibbonColumns(row, snapshot.contributionDays).reduce(
          (sum, column) => sum + column.count,
          0,
        );
        expect(actual).toBe(expected);
      }
    });

    it('resolves one column per day, far finer than the compressed scene ribbon', () => {
      const snapshot = loadHistorySnapshotFixture(RICH_FIXTURE);
      const scene = buildSceneFromSnapshot(snapshot);
      const exportColumns = packEraRows(scene.eras, STATIC_ROW_WIDTH).reduce(
        (sum, row) => sum + exactRibbonColumns(row, snapshot.contributionDays).length,
        0,
      );
      const sceneColumns = scene.eras.reduce((sum, era) => sum + era.ribbon.length, 0);
      expect(exportColumns).toBeGreaterThan(sceneColumns);
    });
  });

  describe('story and badge parity', () => {
    it('carries the scene badges and era titles unchanged', () => {
      const snapshot = loadHistorySnapshotFixture(RICH_FIXTURE);
      const scene = buildSceneFromSnapshot(snapshot);
      const svg = renderMuralExport(snapshot);
      for (const badge of scene.badges) expect(svg).toContain(badge.label);
      for (const era of scene.eras) expect(svg).toContain(era.title);
    });
  });

  describe('cross-world', () => {
    it.each([...WORLD_NAMES])('renders a complete embed-safe export for %s', (world) => {
      const svg = renderMuralExport(loadHistorySnapshotFixture(RICH_FIXTURE), world);
      expect(isComplete(svg)).toBe(true);
      expectEmbedSafeSvg(svg);
    });
  });

  describe('grace floor', () => {
    it('packs a single-commit history into one short row', () => {
      const snapshot = loadHistorySnapshotFixture(SINGLE_COMMIT_FIXTURE);
      const packed = rows(snapshot);
      expect(packed).toHaveLength(1);
      expect(packed[0].width).toBeLessThan(STATIC_ROW_WIDTH);
      expect(isComplete(renderMuralExport(snapshot))).toBe(true);
    });

    it('draws a zero-activity account as one floor-band camp row', () => {
      const packed = rows(zeroActivitySnapshot);
      expect(packed).toHaveLength(1);
      const columns = exactRibbonColumns(packed[0], zeroActivitySnapshot.contributionDays);
      expect(columns.every((column) => column.density === RIBBON_MIN_DENSITY)).toBe(true);
      const svg = renderMuralExport(zeroActivitySnapshot);
      expect(isComplete(svg)).toBe(true);
      expectEmbedSafeSvg(svg);
    });
  });

  describe('determinism', () => {
    it('re-renders the same snapshot and world byte-identically', () => {
      const snapshot = loadHistorySnapshotFixture(DENSE_FIXTURE);
      for (const world of WORLD_NAMES) {
        expect(renderMuralExport(snapshot, world)).toBe(renderMuralExport(snapshot, world));
      }
    });
  });

  describe('XML-hostile handle', () => {
    it('stays embed-safe with a script-injection handle', () => {
      const hostile = buildHistorySnapshot({ handle: '<script>&"\'/' });
      expectEmbedSafeSvg(renderMuralExport(hostile));
    });
  });
});
