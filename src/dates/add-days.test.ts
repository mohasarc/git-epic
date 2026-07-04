import { describe, expect, it } from 'vitest';

import { addDays } from './add-days.js';

describe('addDays', () => {
  it('adds days within a month', () => {
    expect(addDays('2020-01-10', 5)).toBe('2020-01-15');
  });

  it('subtracts days with a negative offset', () => {
    expect(addDays('2020-01-10', -9)).toBe('2020-01-01');
  });

  it('rolls over a month boundary', () => {
    expect(addDays('2020-01-31', 1)).toBe('2020-02-01');
  });

  it('rolls over a leap day', () => {
    expect(addDays('2020-02-28', 1)).toBe('2020-02-29');
  });

  it('rolls over a year boundary', () => {
    expect(addDays('2020-12-31', 1)).toBe('2021-01-01');
  });

  it('returns the same date for a zero offset', () => {
    expect(addDays('2020-06-15', 0)).toBe('2020-06-15');
  });
});
