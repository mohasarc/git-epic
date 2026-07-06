/** The desert-world style system: warm palette, the single sky gradient, tier tints, canvas bands. */

import type { WorldScale } from './mural-scene.js';

export type ModuleFill = { body: string; accent?: string };

/** Tallest a structure slot stands, by world scale — camp squat, metropolis high. */
export const STRUCTURE_HEIGHT: Record<WorldScale, number> = { camp: 46, town: 82, metropolis: 128 };

export const MURAL_HEIGHT = 360;

/** Thin dark outline, fixed across tiers and worlds — an outline, never a fill param. */
export const MURAL_OUTLINE = '#3a2417';
export const MURAL_OUTLINE_WIDTH = 1;

export const MURAL_PALETTE = {
  skyHigh: '#f6b26b',
  skyLow: '#fbe3bd',
  horizon: '#e79a55',
  distantTerrain: '#d98b4a',
  road: '#caa268',
  structureBody: '#c8763c',
  structureAccent: '#8f4a24',
} as const;

/** The only gradient in the mural (§6.9); every other fill is flat. */
export const SKY_GRADIENT_STOPS: readonly { offset: number; color: string }[] = [
  { offset: 0, color: MURAL_PALETTE.skyHigh },
  { offset: 1, color: MURAL_PALETTE.skyLow },
];

export const GROUND_TINT: Record<'ancient' | 'classical' | 'modern', string> = {
  ancient: '#b9793d',
  classical: '#cf9b57',
  modern: '#e6bd7f',
};

export const STRUCTURE_FILL: Record<'ancient' | 'classical' | 'modern', ModuleFill> = {
  ancient: { body: '#a86a3a', accent: '#6f3f20' },
  classical: { body: '#c07f3f', accent: '#7d4a22' },
  modern: { body: '#d69a54', accent: '#8a5228' },
};

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

/** Warm desert density ramp, pale-but-present → saturated terracotta; never GitHub green (§6.6). */
export const RIBBON_RAMP: readonly string[] = ['#f0d5a8', '#e3b877', '#d18f4b', '#b3672f', '#8a4a22'];

/** Standout accent for the spike monument and star gates: warmer and brighter than structureBody. */
export const GOLD_ACCENT = '#f2c14e';

/**
 * Per-language banner accents: each keeps its language's hue identity but pulled toward the warm
 * desert palette (muted, not linguist-literal). Unknown languages fall back to the neutral
 * MURAL_PALETTE.structureAccent in the render layer.
 */
export const LANGUAGE_ACCENT: Record<string, string> = {
  TypeScript: '#4e6a8f',
  JavaScript: '#c9a84e',
  Python: '#5a7fa0',
  Go: '#4f97a3',
  Rust: '#a8593a',
  Java: '#9c6b3f',
  Ruby: '#a5433a',
  C: '#6f7a8a',
  'C++': '#7a5a86',
  'C#': '#5f7a55',
  PHP: '#6b6a9a',
  Swift: '#c07145',
  Kotlin: '#8a6aa0',
  Shell: '#6f8a5a',
  HTML: '#bd6440',
  CSS: '#6a6f9a',
};

/**
 * Whole-strip byte ceiling, calibrated just above the measured dense static render:
 * fifteen-year overflow at metropolis with the ribbon, a stars spike, six motifs across
 * eras, and the four-badge finale — 72438 bytes. ~460 bytes of guard catch bloat now
 * while the render stays a GitHub-safe file with Stage-3 SMIL headroom; not a round bump.
 */
export const MURAL_BYTE_CEILING = 72900;

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
} as const;
