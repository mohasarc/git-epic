import { describe, expect, it } from 'vitest';
import { formatSvgNumber } from './format-svg-number.js';

describe('formatSvgNumber', () => {
  it('keeps a meaningful fraction', () => {
    expect(formatSvgNumber(3.5)).toBe('3.5');
  });

  it('drops trailing zeros from whole numbers', () => {
    expect(formatSvgNumber(830)).toBe('830');
    expect(formatSvgNumber(7)).toBe('7');
  });

  it('collapses float-sum noise', () => {
    expect(formatSvgNumber(3 + 3.5 + 0.49999999999999994)).toBe('7');
    expect(formatSvgNumber(0.1 + 0.2)).toBe('0.3');
  });

  it('never uses scientific notation', () => {
    expect(formatSvgNumber(0.0000001)).toBe('0');
    expect(formatSvgNumber(1e-7)).toBe('0');
  });

  it('rounds to two decimals', () => {
    expect(formatSvgNumber(1.005)).toBe('1');
    expect(formatSvgNumber(414.6789)).toBe('414.68');
  });
});
