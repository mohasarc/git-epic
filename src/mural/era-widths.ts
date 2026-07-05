import type { Chapter } from '../chapters/chapter.js';
import type { MuralEra, WorldScale } from './mural-scene.js';

const PRESENT_DAY_KIND = 'present-day';
type EraWidthKind = Chapter['kind'] | typeof PRESENT_DAY_KIND;

/** Fixed base strip width per chapter kind; the present-day stretch is the reserved end width. */
export const ERA_BASE_WIDTH: Record<EraWidthKind, number> = {
  origin: 160,
  'flagship-rise': 200,
  'dark-age': 220,
  'great-streak': 200,
  prolificacy: 180,
  'star-milestone': 180,
  'language-era': 180,
  [PRESENT_DAY_KIND]: 160,
};

/** +/-15% swing around the base: camp shrinks, town holds, metropolis grows. */
export const WORLD_SCALE_WIDTH_FACTOR: Record<WorldScale, number> = {
  camp: 0.85,
  town: 1,
  metropolis: 1.15,
};

export const MURAL_MARGIN_X = 24;

export type EraPlacement = { x: number; width: number };

export function layOutEras(
  eras: MuralEra[],
  worldScale: WorldScale,
): { placements: EraPlacement[]; width: number } {
  const factor = WORLD_SCALE_WIDTH_FACTOR[worldScale];
  const placements: EraPlacement[] = [];
  let x = MURAL_MARGIN_X;
  for (const era of eras) {
    const width = eraBaseWidth(era) * factor;
    placements.push({ x, width });
    x += width;
  }
  return { placements, width: x + MURAL_MARGIN_X };
}

function eraBaseWidth(era: MuralEra): number {
  return ERA_BASE_WIDTH[era.chapter ? era.chapter.kind : PRESENT_DAY_KIND];
}
