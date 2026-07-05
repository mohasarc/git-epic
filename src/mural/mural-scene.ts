import type { Chapter } from '../chapters/chapter.js';

/** Time-band of an era: which third of the user's own span its start falls in. */
export type MuralTier = 'ancient' | 'classical' | 'modern';

/** Broad-measure scale of the whole world, floored at camp (§3.4). */
export type WorldScale = 'camp' | 'town' | 'metropolis';

/** One contiguous stretch of the strip; consecutive eras meet at a shared date. */
export type MuralEra = {
  chapter: Chapter | null;
  startDate: string;
  endDate: string;
  tier: MuralTier;
};
