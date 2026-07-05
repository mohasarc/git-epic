import { describe, expect, it } from 'vitest';
import {
  GOLD_ACCENT,
  GROUND_TINT,
  LANGUAGE_ACCENT,
  MODULE_PATH_BUDGET,
  MURAL_HEIGHT,
  MURAL_OUTLINE,
  MURAL_OUTLINE_WIDTH,
  MURAL_PALETTE,
  MURAL_TYPOGRAPHY,
  RIBBON_RAMP,
  SEAM_FEATHER_WIDTH,
  SKY_GRADIENT_STOPS,
  STRUCTURE_FILL,
  Y_BANDS,
} from './mural-vocabulary.js';

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/;

const EXPECTED_LANGUAGE_ACCENT_KEYS = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
  'Rust',
  'Java',
  'Ruby',
  'C',
  'C++',
  'C#',
  'PHP',
  'Swift',
  'Kotlin',
  'Shell',
  'HTML',
  'CSS',
];

describe('mural vocabulary', () => {
  it('pins the warm desert palette as stable constants', () => {
    expect(MURAL_PALETTE).toEqual({
      skyHigh: '#f6b26b',
      skyLow: '#fbe3bd',
      horizon: '#e79a55',
      distantTerrain: '#d98b4a',
      road: '#caa268',
      structureBody: '#c8763c',
      structureAccent: '#8f4a24',
    });
    expect(GROUND_TINT).toEqual({
      ancient: '#b9793d',
      classical: '#cf9b57',
      modern: '#e6bd7f',
    });
    expect(STRUCTURE_FILL).toEqual({
      ancient: { body: '#a86a3a', accent: '#6f3f20' },
      classical: { body: '#c07f3f', accent: '#7d4a22' },
      modern: { body: '#d69a54', accent: '#8a5228' },
    });
  });

  it('holds only six-digit lowercase hex colors', () => {
    const colors = [
      ...Object.values(MURAL_PALETTE),
      ...Object.values(GROUND_TINT),
      MURAL_OUTLINE,
      ...Object.values(STRUCTURE_FILL).flatMap((fill) => [fill.body, fill.accent]),
      ...SKY_GRADIENT_STOPS.map((stop) => stop.color),
      GOLD_ACCENT,
      ...Object.values(LANGUAGE_ACCENT),
    ].filter((value): value is string => value !== undefined);
    for (const color of colors) {
      expect(color).toMatch(HEX_COLOR_PATTERN);
    }
  });

  it('adds a gold accent lifted above the structure body and distinct from the ribbon ramp', () => {
    expect(GOLD_ACCENT).toMatch(HEX_COLOR_PATTERN);
    expect(GOLD_ACCENT).not.toBe(MURAL_PALETTE.structureBody);
    expect(RIBBON_RAMP).not.toContain(GOLD_ACCENT);
  });

  it('maps common languages to muted accents, defaulting to the neutral structure accent', () => {
    expect(Object.keys(LANGUAGE_ACCENT).sort()).toEqual([...EXPECTED_LANGUAGE_ACCENT_KEYS].sort());
    const accents = Object.values(LANGUAGE_ACCENT);
    expect(accents.length).toBeGreaterThan(0);
    // Distinct hues, and none collapses onto the neutral default used for unknown languages.
    expect(new Set(accents).size).toBe(accents.length);
    for (const accent of accents) {
      expect(accent).not.toBe(MURAL_PALETTE.structureAccent);
    }
  });

  it('exposes the sky gradient as the only gradient, ascending by offset', () => {
    expect(SKY_GRADIENT_STOPS.length).toBeGreaterThanOrEqual(2);
    const offsets = SKY_GRADIENT_STOPS.map((stop) => stop.offset);
    expect(offsets[0]).toBe(0);
    expect(offsets[offsets.length - 1]).toBe(1);
    for (let index = 1; index < offsets.length; index += 1) {
      expect(offsets[index]).toBeGreaterThan(offsets[index - 1]);
    }
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

  it('declares a thin outline width and per-module path budgets', () => {
    expect(MURAL_OUTLINE_WIDTH).toBeGreaterThan(0);
    expect(SEAM_FEATHER_WIDTH).toBeGreaterThan(0);
    expect(MODULE_PATH_BUDGET).toEqual({ structure: 5, tent: 3, marker: 3, prop: 2 });
  });
});
