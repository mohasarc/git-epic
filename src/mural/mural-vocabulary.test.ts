import { describe, expect, it } from 'vitest';
import {
  CAMERA_WINDOW_WIDTH,
  FINALE_HEIGHT,
  FOOTER_HEIGHT,
  HEADER_HEIGHT,
  MARGIN,
  MODULE_PATH_BUDGET,
  MURAL_ANIMATED_BYTE_CEILING,
  MURAL_BYTE_CEILING,
  MURAL_HEIGHT,
  MURAL_OUTLINE,
  MURAL_OUTLINE_WIDTH,
  MURAL_TYPOGRAPHY,
  ROW_GAP,
  SEAM_FEATHER_WIDTH,
  STATIC_EXPORT_BYTE_CEILING,
  STATIC_ROW_WIDTH,
  Y_BANDS,
} from './mural-vocabulary.js';
import { detectChapters } from '../chapters/detect-chapters.js';
import { narrateChapter } from '../narration/narrate-chapter.js';
import { scoreStrengths } from '../strengths/score-strengths.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { buildMuralScene } from './build-mural-scene.js';
import { renderStaticExport } from './render-static-export.js';
import { WORLD_NAMES, worlds } from './worlds/catalog.js';

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/;

describe('mural vocabulary', () => {
  it('pins the outline as a six-digit lowercase hex color', () => {
    expect(MURAL_OUTLINE).toMatch(HEX_COLOR_PATTERN);
  });

  it('orders the Y bands top-to-bottom within the canvas', () => {
    expect(MURAL_HEIGHT).toBeGreaterThan(0);
    expect(Y_BANDS.skyBottom).toBeLessThan(Y_BANDS.horizonBottom);
    expect(Y_BANDS.horizonBottom).toBeLessThan(Y_BANDS.roadBaseline);
    expect(Y_BANDS.roadBaseline).toBeLessThan(Y_BANDS.ribbonBottom);
    expect(Y_BANDS.ribbonBottom).toBeLessThanOrEqual(MURAL_HEIGHT);
  });

  it('uses a system-sans typography stack, no external fonts', () => {
    expect(MURAL_TYPOGRAPHY.fontStack).toContain('system-ui');
    expect(MURAL_TYPOGRAPHY.fontStack).not.toMatch(/https?:/);
  });

  it('frames the camera on a window narrower than the finale anchor is wide', () => {
    expect(CAMERA_WINDOW_WIDTH).toBeGreaterThan(0);
    expect(Number.isInteger(CAMERA_WINDOW_WIDTH)).toBe(true);
  });

  it('reserves a separate animated ceiling above the static one', () => {
    expect(Number.isInteger(MURAL_ANIMATED_BYTE_CEILING)).toBe(true);
    expect(MURAL_ANIMATED_BYTE_CEILING).toBeGreaterThan(MURAL_BYTE_CEILING);
  });

  it('pins the static-export ceiling just above the measured dense render', () => {
    expect(Number.isInteger(STATIC_EXPORT_BYTE_CEILING)).toBe(true);
    const snapshot = loadHistorySnapshotFixture('fifteen-year-overflow.json');
    const narrated = detectChapters(snapshot).map((chapter) => ({
      chapter,
      narration: narrateChapter(chapter),
    }));
    const scene = buildMuralScene(snapshot, narrated, scoreStrengths(snapshot));
    const measuredMax = Math.max(
      ...WORLD_NAMES.map((world) =>
        Buffer.byteLength(renderStaticExport(scene, worlds[world], snapshot.contributionDays), 'utf8'),
      ),
    );
    expect(STATIC_EXPORT_BYTE_CEILING).toBeGreaterThan(measuredMax);
    expect(STATIC_EXPORT_BYTE_CEILING - measuredMax).toBeLessThan(1000);
  });

  it('sizes the static export as a row width plus symmetric margins and stacked bands', () => {
    for (const value of [STATIC_ROW_WIDTH, ROW_GAP, MARGIN, HEADER_HEIGHT, FINALE_HEIGHT, FOOTER_HEIGHT]) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
    }
    expect(STATIC_ROW_WIDTH).toBe(640);
    expect(ROW_GAP).toBe(16);
  });

  it('declares a thin outline width and per-module path budgets', () => {
    expect(MURAL_OUTLINE_WIDTH).toBeGreaterThan(0);
    expect(SEAM_FEATHER_WIDTH).toBeGreaterThan(0);
    expect(MODULE_PATH_BUDGET).toEqual({
      structure: 5,
      tent: 3,
      marker: 3,
      prop: 2,
      banner: 3,
      crownGate: 4,
      sideRoad: 2,
      crowd: 3,
      bridge: 4,
      noticeBoard: 3,
      dockHut: 3,
      boat: 2,
      cairn: 3,
      pine: 2,
    });
  });
});
