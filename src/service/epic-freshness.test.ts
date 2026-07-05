import { describe, expect, it } from 'vitest';
import {
  EPIC_FRESHNESS_MS,
  epicCacheControlSeconds,
  freshnessAgeMs,
  isEpicFresh,
} from './epic-freshness.js';

describe('freshnessAgeMs', () => {
  it('returns the millisecond difference between now and rendered instants', () => {
    expect(freshnessAgeMs('2026-07-05T12:00:00.000Z', '2026-07-05T10:00:00.000Z')).toBe(
      2 * 60 * 60 * 1000,
    );
  });

  it('returns a negative age when rendered is in the future of now', () => {
    expect(freshnessAgeMs('2026-07-05T10:00:00.000Z', '2026-07-05T12:00:00.000Z')).toBe(
      -2 * 60 * 60 * 1000,
    );
  });
});

describe('isEpicFresh', () => {
  it('is fresh just under the 24-hour boundary', () => {
    const renderedAtIso = '2026-07-05T00:00:00.000Z';
    const nowIso = new Date(Date.parse(renderedAtIso) + EPIC_FRESHNESS_MS - 1).toISOString();
    expect(isEpicFresh(nowIso, renderedAtIso)).toBe(true);
  });

  it('is stale at exactly the 24-hour boundary', () => {
    const renderedAtIso = '2026-07-05T00:00:00.000Z';
    const nowIso = new Date(Date.parse(renderedAtIso) + EPIC_FRESHNESS_MS).toISOString();
    expect(isEpicFresh(nowIso, renderedAtIso)).toBe(false);
  });
});

describe('epicCacheControlSeconds', () => {
  it('clamps a zero age to the full 24-hour max-age', () => {
    expect(epicCacheControlSeconds(0)).toBe(86400);
  });

  it('clamps a negative age to the full 24-hour max-age', () => {
    expect(epicCacheControlSeconds(-5000)).toBe(86400);
  });

  it('subtracts elapsed whole seconds from the 24-hour max-age', () => {
    expect(epicCacheControlSeconds(20 * 60 * 60 * 1000)).toBe(14400);
  });

  it('floors sub-second remainders before subtracting', () => {
    expect(epicCacheControlSeconds(1999)).toBe(86400 - 1);
  });

  it('clamps a near-boundary age to the 300-second floor', () => {
    expect(epicCacheControlSeconds(EPIC_FRESHNESS_MS - 1000)).toBe(300);
  });
});
