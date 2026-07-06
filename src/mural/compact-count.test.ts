import { describe, expect, it } from 'vitest';
import { compactCount } from './compact-count.js';

describe('compactCount', () => {
  it('passes counts below 1000 through verbatim', () => {
    expect(compactCount(0)).toBe('0');
    expect(compactCount(184)).toBe('184');
    expect(compactCount(999)).toBe('999');
  });

  it('formats thousands with one decimal below 10k, zero at or above', () => {
    expect(compactCount(1000)).toBe('1k');
    expect(compactCount(1200)).toBe('1.2k');
    expect(compactCount(4800)).toBe('4.8k');
    expect(compactCount(18000)).toBe('18k');
    expect(compactCount(312000)).toBe('312k');
    expect(compactCount(999999)).toBe('1000k');
  });

  it('carries a rounded k-value across the 10k band edge', () => {
    expect(compactCount(9990)).toBe('10k');
  });

  it('formats millions with the same decimal rule', () => {
    expect(compactCount(1_200_000)).toBe('1.2M');
  });
});
