import { describe, expect, it } from 'vitest';

import { differenceInDays } from './difference-in-days.js';

describe('differenceInDays', () => {
  it('counts one day between consecutive dates', () => {
    expect(differenceInDays('2020-01-01', '2020-01-02')).toBe(1);
  });

  it('returns zero for the same date', () => {
    expect(differenceInDays('2020-01-01', '2020-01-01')).toBe(0);
  });

  it('crosses a month boundary', () => {
    expect(differenceInDays('2020-01-31', '2020-02-01')).toBe(1);
  });

  it('crosses a year boundary', () => {
    expect(differenceInDays('2019-12-31', '2020-01-01')).toBe(1);
  });

  it('counts the leap day in a leap-year February', () => {
    expect(differenceInDays('2020-02-28', '2020-03-01')).toBe(2);
  });

  it('skips the leap day in a non-leap February', () => {
    expect(differenceInDays('2021-02-28', '2021-03-01')).toBe(1);
  });

  it('counts a multi-year span exactly', () => {
    // 2020 is a leap year: 366 + 365 + 365 + 365 = 1461
    expect(differenceInDays('2020-01-01', '2024-01-01')).toBe(1461);
  });
});
