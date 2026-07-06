import type { StrengthDimension } from './strength-dimensions.js';

/** Ladder knots [t1,t2,t3,t4] — strictly positive, strictly ascending. */
export type TierThresholds = readonly [number, number, number, number];

/**
 * Per-dimension ladders, hand-calibrated against each other so that reaching the
 * same tier on any dimension reads as comparably notable (see the named
 * cross-dimension-calibration risk in the plan).
 */
export const DIMENSION_TIER_THRESHOLDS: Record<StrengthDimension, TierThresholds> = {
  projectCount: [3, 10, 25, 60],
  stars: [10, 100, 1000, 10000],
  forks: [5, 50, 500, 5000],
  followers: [10, 100, 1000, 10000],
  pullRequests: [10, 50, 250, 1000],
  issues: [10, 50, 250, 1000],
  languageBreadth: [2, 4, 7, 12],
  activityVolume: [100, 1000, 5000, 20000],
};
