import { describe, expect, it } from 'vitest';
import { boatModule } from '../modules/boat.js';
import { dockHutModule } from '../modules/dock-hut.js';
import { desert } from './desert.js';
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

describe('river world', () => {
  it('is a river-spine world, not the desert alias', () => {
    expect(river.name).toBe('river');
    expect(river.spine.kind).toBe('river');
    expect(river).not.toEqual(desert);
  });

  it('carries a flowing water spine with a lighter current highlight', () => {
    expect(river.spine.color).toMatch(HEX_COLOR_PATTERN);
    expect(river.spine.highlight).toMatch(HEX_COLOR_PATTERN);
    expect(river.spine.highlight).not.toBe(river.spine.color);
  });

  it('carries the dock-hut camp and boat prop signatures', () => {
    expect(river.modules.camp).toBe(dockHutModule);
    expect(river.modules.prop).toBe(boatModule);
  });

  it('holds only six-digit lowercase hex colors', () => {
    const colors = [
      river.distantTerrain,
      river.spine.color,
      river.spine.highlight,
      river.structureBody,
      river.structureAccent,
      river.goldAccent,
      river.panelFill,
      river.languageAccentFallback,
      ...Object.values(river.groundTint),
      ...Object.values(river.structureFill).flatMap((fill) => [fill.body, fill.accent]),
      ...river.sky.map((stop) => stop.color),
      ...river.ribbonRamp,
      ...Object.values(river.languageAccent),
    ].filter((value): value is string => value !== undefined);
    for (const color of colors) {
      expect(color).toMatch(HEX_COLOR_PATTERN);
    }
  });

  it('lifts the gold accent above the structure body and off the ribbon ramp', () => {
    expect(river.goldAccent).not.toBe(river.structureBody);
    expect(river.ribbonRamp).not.toContain(river.goldAccent);
  });

  it('maps common languages to distinct cool accents, none the neutral fallback', () => {
    expect(Object.keys(river.languageAccent).sort()).toEqual([...EXPECTED_LANGUAGE_ACCENT_KEYS].sort());
    const accents = Object.values(river.languageAccent);
    expect(new Set(accents).size).toBe(accents.length);
    for (const accent of accents) {
      expect(accent).not.toBe(river.languageAccentFallback);
    }
  });

  it('exposes the sky gradient ascending by offset', () => {
    expect(river.sky.length).toBeGreaterThanOrEqual(2);
    const offsets = river.sky.map((stop) => stop.offset);
    expect(offsets[0]).toBe(0);
    expect(offsets[offsets.length - 1]).toBe(1);
    for (let index = 1; index < offsets.length; index += 1) {
      expect(offsets[index]).toBeGreaterThan(offsets[index - 1]);
    }
  });
});
