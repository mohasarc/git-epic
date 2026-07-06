import { describe, expect, it } from 'vitest';
import { cairnModule } from '../modules/cairn.js';
import { pineModule } from '../modules/pine.js';
import { desert } from './desert.js';
import { mountain } from './mountain.js';
import { river } from './river.js';

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

describe('mountain world', () => {
  it('is its own world, not the desert alias or river', () => {
    expect(mountain.name).toBe('mountain');
    expect(mountain).not.toEqual(desert);
    expect(mountain).not.toEqual(river);
  });

  it('keeps a recolored road spine — no water, no current highlight', () => {
    expect(mountain.spine.kind).toBe('road');
    expect(mountain.spine.color).toMatch(HEX_COLOR_PATTERN);
    expect(mountain.spine.highlight).toBeUndefined();
  });

  it('carries the cairn camp and pine prop signatures', () => {
    expect(mountain.modules.camp).toBe(cairnModule);
    expect(mountain.modules.prop).toBe(pineModule);
  });

  it('holds only six-digit lowercase hex colors', () => {
    const colors = [
      mountain.distantTerrain,
      mountain.spine.color,
      mountain.structureBody,
      mountain.structureAccent,
      mountain.goldAccent,
      mountain.panelFill,
      mountain.languageAccentFallback,
      ...Object.values(mountain.groundTint),
      ...Object.values(mountain.structureFill).flatMap((fill) => [fill.body, fill.accent]),
      ...mountain.sky.map((stop) => stop.color),
      ...mountain.ribbonRamp,
      ...Object.values(mountain.languageAccent),
    ].filter((value): value is string => value !== undefined);
    for (const color of colors) {
      expect(color).toMatch(HEX_COLOR_PATTERN);
    }
  });

  it('lifts the gold accent above the structure body and off the ribbon ramp', () => {
    expect(mountain.goldAccent).not.toBe(mountain.structureBody);
    expect(mountain.ribbonRamp).not.toContain(mountain.goldAccent);
  });

  it('maps common languages to distinct cool accents, none the neutral fallback', () => {
    expect(Object.keys(mountain.languageAccent).sort()).toEqual(
      [...EXPECTED_LANGUAGE_ACCENT_KEYS].sort(),
    );
    const accents = Object.values(mountain.languageAccent);
    expect(new Set(accents).size).toBe(accents.length);
    for (const accent of accents) {
      expect(accent).not.toBe(mountain.languageAccentFallback);
    }
  });

  it('exposes the sky gradient ascending by offset', () => {
    expect(mountain.sky.length).toBeGreaterThanOrEqual(2);
    const offsets = mountain.sky.map((stop) => stop.offset);
    expect(offsets[0]).toBe(0);
    expect(offsets[offsets.length - 1]).toBe(1);
    for (let index = 1; index < offsets.length; index += 1) {
      expect(offsets[index]).toBeGreaterThan(offsets[index - 1]);
    }
  });
});
