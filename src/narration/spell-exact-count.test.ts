import { describe, expect, it } from 'vitest';

import { spellExactCount } from './spell-exact-count.js';

describe('spellExactCount', () => {
  it('spells single digits', () => {
    expect(spellExactCount(1)).toBe('one');
  });

  it('spells round tens', () => {
    expect(spellExactCount(30)).toBe('thirty');
  });

  it('hyphenates 21-99', () => {
    expect(spellExactCount(47)).toBe('forty-seven');
  });

  it('spells teens', () => {
    expect(spellExactCount(14)).toBe('fourteen');
  });

  it('puts "and" before final tens and units after hundreds', () => {
    expect(spellExactCount(140)).toBe('one hundred and forty');
  });

  it('spells the 179/180 boundary pair', () => {
    expect(spellExactCount(179)).toBe('one hundred and seventy-nine');
    expect(spellExactCount(180)).toBe('one hundred and eighty');
  });

  it('spells round hundreds without "and"', () => {
    expect(spellExactCount(300)).toBe('three hundred');
  });

  it('spells round thousands', () => {
    expect(spellExactCount(2000)).toBe('two thousand');
  });

  it('puts "and" before final tens after thousands with no hundreds', () => {
    expect(spellExactCount(1005)).toBe('one thousand and five');
  });

  it('spells the top of the range', () => {
    expect(spellExactCount(9999)).toBe('nine thousand nine hundred and ninety-nine');
    expect(spellExactCount(99999)).toBe('ninety-nine thousand nine hundred and ninety-nine');
  });

  it('rejects counts outside 1..99999', () => {
    expect(() => spellExactCount(0)).toThrow(RangeError);
    expect(() => spellExactCount(100000)).toThrow(RangeError);
    expect(() => spellExactCount(2.5)).toThrow(RangeError);
  });
});
