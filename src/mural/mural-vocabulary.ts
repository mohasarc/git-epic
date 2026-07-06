/** Shared mural geometry: canvas bands, outline, typography, budgets, byte ceilings — world-independent. */

import type { WorldScale } from './mural-scene.js';

export type ModuleFill = { body: string; accent?: string };

/** Tallest a structure slot stands, by world scale — camp squat, metropolis high. */
export const STRUCTURE_HEIGHT: Record<WorldScale, number> = { camp: 46, town: 82, metropolis: 128 };

export const MURAL_HEIGHT = 360;

/**
 * Width of the camera window the animated mural pans through (§Stage-3). ~3–4 eras frame at
 * once; the finale panel anchors to this width so the freeze frame never clips. Default
 * calibration; confirmed against the finale width in Phase 6.
 */
export const CAMERA_WINDOW_WIDTH = 640;

/** Thin dark outline, fixed across tiers and worlds — an outline, never a fill param. */
export const MURAL_OUTLINE = '#3a2417';
export const MURAL_OUTLINE_WIDTH = 1;

export const MURAL_TYPOGRAPHY = {
  fontStack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
} as const;

/** Horizontal band edges down the canvas; road baseline is also the ribbon's top edge. */
export const Y_BANDS = {
  skyBottom: 150,
  horizonBottom: 210,
  roadBaseline: 300,
  ribbonBottom: 331,
} as const;

/** Flat-fill overlap width where adjacent era ground tints meet (§6, no seam gradient). */
export const SEAM_FEATHER_WIDTH = 12;

/** Target column pixel pitch for the ribbon; per-era column count = round(eraWidth / RIBBON_PITCH). */
export const RIBBON_PITCH = 4;

/**
 * Whole-strip byte ceiling, calibrated just above the measured dense static render, worst case
 * across the three worlds: fifteen-year overflow at metropolis in mountain — the grey-green stone
 * tiers edge past desert's 72438 and river's 72478 to 72486 bytes, the honest cross-world max.
 * ~414 bytes of guard catch bloat while the render stays a GitHub-safe file; not a round bump.
 */
export const MURAL_BYTE_CEILING = 72900;

/**
 * Animated whole-file ceiling, calibrated just above the measured worst-case dense animated render,
 * binding max across the three worlds: fifteen-year overflow at metropolis in river — its flow loop
 * tops desert's 75371 and mountain's 75419 to 75610 bytes — 3 plane translates, six dwell beats, the
 * finale fade, and the rest-window ambient loops on top of the static strip. ~240 bytes of guard
 * catch SMIL bloat while the file stays GitHub-safe. Separate from the static ceiling; the static
 * render never carries this weight.
 */
export const MURAL_ANIMATED_BYTE_CEILING = 75850;

/** Literal §6.9 per-module element cap (path/rect/circle/polygon). */
export const MODULE_PATH_BUDGET = {
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
} as const;
