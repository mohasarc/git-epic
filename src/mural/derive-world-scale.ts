import type { StrengthsResult } from '../strengths/score-strengths.js';
import type { WorldScale } from './mural-scene.js';

/**
 * Mean-reach bands. Taking the mean over available dimensions keeps a one-spike
 * account small (its spike alone can't carry the average past camp) while a
 * broadly strong account reaches metropolis.
 */
export const WORLD_SCALE_THRESHOLDS = { town: 0.25, metropolis: 0.45 } as const;

export function deriveWorldScale(strengths: StrengthsResult): WorldScale {
  const reaches = strengths.ranked.map((score) => score.reach);
  if (reaches.length === 0) return 'camp';

  const meanReach = reaches.reduce((total, reach) => total + reach, 0) / reaches.length;
  if (meanReach < WORLD_SCALE_THRESHOLDS.town) return 'camp';
  if (meanReach < WORLD_SCALE_THRESHOLDS.metropolis) return 'town';
  return 'metropolis';
}
