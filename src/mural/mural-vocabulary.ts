/** The desert-world style system: warm palette, the single sky gradient, tier tints, canvas bands. */

export type ModuleFill = { body: string; accent?: string };

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

/**
 * Whole-strip byte ceiling, calibrated just above the measured dense static render
 * (rich / fifteen-year mural with the ribbon). Catches bloat now while leaving Stage-3
 * SMIL headroom; not a rubber-stamped round number.
 */
export const MURAL_BYTE_CEILING = 72000;

/** Literal §6.9 per-module element cap (path/rect/circle/polygon). */
export const MODULE_PATH_BUDGET = {
  structure: 5,
  tent: 3,
  marker: 3,
  prop: 2,
} as const;
