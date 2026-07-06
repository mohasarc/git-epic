import { describe, expect, it } from 'vitest';
import {
  CAMERA_WINDOW_WIDTH,
  MODULE_PATH_BUDGET,
  MURAL_ANIMATED_BYTE_CEILING,
  MURAL_BYTE_CEILING,
  MURAL_HEIGHT,
  MURAL_OUTLINE,
  MURAL_OUTLINE_WIDTH,
  MURAL_TYPOGRAPHY,
  SEAM_FEATHER_WIDTH,
  Y_BANDS,
} from './mural-vocabulary.js';

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
    });
  });
});
