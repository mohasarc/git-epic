import type { StrengthScore, StrengthsResult } from '../strengths/score-strengths.js';
import type { StrengthDimension } from '../strengths/strength-dimensions.js';
import { compactCount } from './compact-count.js';
import { deriveWorldScale } from './derive-world-scale.js';
import type { MuralMotif, MuralMotifKind, PlacedEra, WorldScale } from './mural-scene.js';
import { STRUCTURE_HEIGHT, Y_BANDS } from './mural-vocabulary.js';

/** Crowd figures drawn before the plaque carries the rest; a crowd never floods an era. */
export const MAX_CROWD_FIGURES = 6;
/** Boulevard banners drawn before the plaque names the true language count. */
export const MAX_BOULEVARD_BANNERS = 8;

/** A dimension monuments only when its tier clears the world's baseline by this much. */
const SPIKE_TIER_GAP = 2;
const SPIKE_BASELINE: Record<WorldScale, number> = { camp: 0, town: 1, metropolis: 2 };

const LANE_INNER_PAD = 6;
const LANE_FILL_RATIO = 0.7;
/** Gap a sky-anchored banner keeps above the tallest structure so it never collides. */
const BANNER_CLEARANCE = 8;

/** Strength dimensions with no motif: project density rides the slot allocator, activity the ribbon. */
const KIND_BY_DIMENSION: Partial<Record<StrengthDimension, MuralMotifKind>> = {
  stars: 'crownGate',
  forks: 'sideRoad',
  followers: 'crowd',
  pullRequests: 'bridge',
  issues: 'noticeBoard',
  languageBreadth: 'banner',
};

const PLAQUE_SUFFIX: Partial<Record<StrengthDimension, string>> = {
  stars: '★',
  pullRequests: 'PRs',
  issues: 'issues',
  forks: 'forks',
  followers: 'followers',
};

type MotifSpec = Omit<MuralMotif, 'x' | 'width' | 'baselineY'>;

/**
 * Attach strength motifs to placed eras. Pure: same eras + strengths in, same motifs
 * out, no seed and no clock. Qualifying dimensions route to a silhouette kind; a
 * spike monument fires for a dimension that punches above the world's size; an
 * all-tier-0 account still grace-floors to one neutral hopeful banner in present day.
 */
export function placeMotifs(eras: PlacedEra[], strengths: StrengthsResult): PlacedEra[] {
  const worldScale = deriveWorldScale(strengths);
  const perEra: MotifSpec[][] = eras.map(() => []);
  const specs = qualifyingSpecs(strengths, worldScale);

  if (specs.length === 0) {
    const neutral = neutralSpec(strengths);
    if (neutral) perEra[eras.length - 1].push(neutral);
  } else {
    const hosts = hostOrder(eras);
    specs.forEach((spec, index) => perEra[hosts[index % hosts.length]].push(spec));
  }

  return eras.map((era, index) => ({ ...era, motifs: layOutLanes(perEra[index], era, worldScale) }));
}

function qualifyingSpecs(strengths: StrengthsResult, worldScale: WorldScale): MotifSpec[] {
  const specs = strengths.ranked
    .filter((score) => KIND_BY_DIMENSION[score.dimension] && score.tier >= 1)
    .map((score) => toSpec(score));

  const gap = SPIKE_BASELINE[worldScale] + SPIKE_TIER_GAP;
  const spikeIndex = specs.findIndex((spec) => spec.tier >= gap);
  if (spikeIndex >= 0) specs[spikeIndex].standout = true;
  return specs;
}

function toSpec(score: StrengthScore): MotifSpec {
  const kind = KIND_BY_DIMENSION[score.dimension] as MuralMotifKind;
  return {
    dimension: score.dimension,
    kind,
    tier: score.tier,
    count: atomCount(kind, score.rawValue),
    standout: false,
    plaque: plaqueFor(score, kind),
  };
}

function atomCount(kind: MuralMotifKind, rawValue: number): number {
  if (kind === 'crowd') return Math.min(rawValue, MAX_CROWD_FIGURES);
  if (kind === 'banner') return Math.min(rawValue, MAX_BOULEVARD_BANNERS);
  return 1;
}

function plaqueFor(score: StrengthScore, kind: MuralMotifKind): string | undefined {
  if (kind === 'banner') {
    return score.rawValue > MAX_BOULEVARD_BANNERS ? `${compactCount(score.rawValue)} languages` : undefined;
  }
  const suffix = PLAQUE_SUFFIX[score.dimension];
  return suffix ? `${compactCount(score.rawValue)} ${suffix}` : undefined;
}

/** A neutral, plaque-free banner so a zero account still reads as a hopeful camp, never a "0 ★" gate. */
function neutralSpec(strengths: StrengthsResult): MotifSpec | undefined {
  const headline = strengths.ranked[0];
  if (!headline) return undefined;
  return { dimension: headline.dimension, kind: 'banner', tier: 0, count: 1, standout: false };
}

/** Widest eras host first; present day is left clear unless it is the only era (never `i mod 0`). */
function hostOrder(eras: PlacedEra[]): number[] {
  const hostable = eras.length > 1 ? eras.slice(0, -1) : eras;
  return hostable
    .map((_, index) => index)
    .sort((a, b) => eras[b].width - eras[a].width || a - b);
}

function layOutLanes(specs: MotifSpec[], era: PlacedEra, worldScale: WorldScale): MuralMotif[] {
  if (specs.length === 0) return [];
  const usableWidth = Math.max(0, era.width - LANE_INNER_PAD * 2);
  const laneWidth = usableWidth / specs.length;
  return specs.map((spec, index) => ({
    ...spec,
    x: era.x + LANE_INNER_PAD + index * laneWidth,
    width: laneWidth * LANE_FILL_RATIO,
    baselineY: baselineFor(spec.kind, worldScale),
  }));
}

function baselineFor(kind: MuralMotifKind, worldScale: WorldScale): number {
  if (kind === 'banner') return Y_BANDS.roadBaseline - STRUCTURE_HEIGHT[worldScale] - BANNER_CLEARANCE;
  return Y_BANDS.roadBaseline;
}
