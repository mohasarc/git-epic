import { describe, expect, it } from 'vitest';
import { propModule } from '../modules/prop.js';
import { tentModule } from '../modules/tent.js';
import { desert } from './desert.js';

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

describe('desert world', () => {
  it('pins the warm desert palette moved verbatim from the vocabulary', () => {
    expect(desert.name).toBe('desert');
    expect(desert.sky).toEqual([
      { offset: 0, color: '#f6b26b' },
      { offset: 1, color: '#fbe3bd' },
    ]);
    expect(desert.distantTerrain).toBe('#d98b4a');
    expect(desert.spine).toEqual({ kind: 'road', color: '#caa268' });
    expect(desert.structureBody).toBe('#c8763c');
    expect(desert.structureAccent).toBe('#8f4a24');
    expect(desert.goldAccent).toBe('#f2c14e');
    expect(desert.panelFill).toBe('#fbe3bd');
    expect(desert.languageAccentFallback).toBe('#8f4a24');
    expect(desert.groundTint).toEqual({
      ancient: '#b9793d',
      classical: '#cf9b57',
      modern: '#e6bd7f',
    });
    expect(desert.structureFill).toEqual({
      ancient: { body: '#a86a3a', accent: '#6f3f20' },
      classical: { body: '#c07f3f', accent: '#7d4a22' },
      modern: { body: '#d69a54', accent: '#8a5228' },
    });
    expect(desert.ribbonRamp).toEqual(['#f0d5a8', '#e3b877', '#d18f4b', '#b3672f', '#8a4a22']);
  });

  it('carries the tent camp and prop signatures', () => {
    expect(desert.modules.camp).toBe(tentModule);
    expect(desert.modules.prop).toBe(propModule);
  });

  it('holds only six-digit lowercase hex colors', () => {
    const colors = [
      desert.distantTerrain,
      desert.spine.color,
      desert.structureBody,
      desert.structureAccent,
      desert.goldAccent,
      desert.panelFill,
      desert.languageAccentFallback,
      ...Object.values(desert.groundTint),
      ...Object.values(desert.structureFill).flatMap((fill) => [fill.body, fill.accent]),
      ...desert.sky.map((stop) => stop.color),
      ...Object.values(desert.languageAccent),
    ].filter((value): value is string => value !== undefined);
    for (const color of colors) {
      expect(color).toMatch(HEX_COLOR_PATTERN);
    }
  });

  it('lifts the gold accent above the structure body and off the ribbon ramp', () => {
    expect(desert.goldAccent).not.toBe(desert.structureBody);
    expect(desert.ribbonRamp).not.toContain(desert.goldAccent);
  });

  it('maps common languages to distinct muted accents, none the neutral fallback', () => {
    expect(Object.keys(desert.languageAccent).sort()).toEqual([...EXPECTED_LANGUAGE_ACCENT_KEYS].sort());
    const accents = Object.values(desert.languageAccent);
    expect(new Set(accents).size).toBe(accents.length);
    for (const accent of accents) {
      expect(accent).not.toBe(desert.languageAccentFallback);
    }
  });

  it('exposes the sky gradient ascending by offset', () => {
    expect(desert.sky.length).toBeGreaterThanOrEqual(2);
    const offsets = desert.sky.map((stop) => stop.offset);
    expect(offsets[0]).toBe(0);
    expect(offsets[offsets.length - 1]).toBe(1);
    for (let index = 1; index < offsets.length; index += 1) {
      expect(offsets[index]).toBeGreaterThan(offsets[index - 1]);
    }
  });
});
