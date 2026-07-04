import type { HistorySnapshot } from '../history-snapshot.js';

export type AmbientVisualDrivers = {
  /** 1..5, from repository count. */
  orbitingBodyCount: number;
  /** Floor 8, banded from total star count. */
  twinkleStarCount: number;
};

const ORBITING_BODY_FLOOR = 1;
const ORBITING_BODY_CAP = 5;
const TWINKLE_FLOOR = 8;
const TWINKLE_STAR_BANDS = [
  { minimumTotalStars: 10000, twinkleStarCount: 16 },
  { minimumTotalStars: 1000, twinkleStarCount: 14 },
  { minimumTotalStars: 100, twinkleStarCount: 12 },
  { minimumTotalStars: 10, twinkleStarCount: 10 },
] as const;

export function deriveAmbientScene(snapshot: HistorySnapshot): AmbientVisualDrivers {
  return {
    orbitingBodyCount: orbitingBodyCount(snapshot.repositories.length),
    twinkleStarCount: twinkleStarCount(totalStarCount(snapshot)),
  };
}

function orbitingBodyCount(repositoryCount: number): number {
  return Math.min(Math.max(repositoryCount, ORBITING_BODY_FLOOR), ORBITING_BODY_CAP);
}

function twinkleStarCount(totalStars: number): number {
  const band = TWINKLE_STAR_BANDS.find(({ minimumTotalStars }) => totalStars >= minimumTotalStars);
  return band?.twinkleStarCount ?? TWINKLE_FLOOR;
}

function totalStarCount(snapshot: HistorySnapshot): number {
  return snapshot.repositories.reduce((sum, repository) => sum + repository.starCount, 0);
}
