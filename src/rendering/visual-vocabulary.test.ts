import { describe, expect, it } from 'vitest';
import { PALETTE, STYLE_MOTION, TYPOGRAPHY } from './visual-vocabulary.js';

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/;

function relativeLuminance(hexColor: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const channel = parseInt(hexColor.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

describe('visual vocabulary', () => {
  it('exports non-empty palette, typography, and style-motion values', () => {
    expect(Object.keys(PALETTE).length).toBeGreaterThan(0);
    expect(TYPOGRAPHY.fontStack.length).toBeGreaterThan(0);
    expect(TYPOGRAPHY.captionTreatment.length).toBeGreaterThan(0);
    expect(TYPOGRAPHY.titleLetterSpacing).toBeGreaterThan(0);
    expect(STYLE_MOTION.twinklePeriodSeconds).toBeGreaterThan(0);
    expect(STYLE_MOTION.ambientDriftSeconds).toBeGreaterThan(0);
  });

  it('holds only six-digit lowercase hex colors', () => {
    for (const [name, color] of Object.entries(PALETTE)) {
      expect(color, name).toMatch(HEX_COLOR_PATTERN);
    }
  });

  it('keeps the background dark enough for scenes to glow against', () => {
    expect(relativeLuminance(PALETTE.background)).toBeLessThan(0.05);
  });
});
