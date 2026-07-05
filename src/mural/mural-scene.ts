import type { Chapter } from '../chapters/chapter.js';
import type { StrengthScore } from '../strengths/score-strengths.js';
import type { StrengthDimension } from '../strengths/strength-dimensions.js';

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

/** One left-to-right allocated placement for a structure, marker, or prop. */
export type MuralSlot = {
  x: number;
  width: number;
  baselineY: number;
  type: 'structure' | 'marker' | 'prop';
};

/** One fixed-pitch column of the contribution ribbon; density is 0..1 (never 0). */
export type RibbonColumn = { x: number; width: number; density: number };

/** Which strength-driven silhouette a motif draws. */
export type MuralMotifKind = 'banner' | 'crownGate' | 'sideRoad' | 'crowd' | 'bridge' | 'noticeBoard';

/**
 * One strength motif placed inside an era. `tier` drives count/scale, not shape.
 * `standout` marks the single spike monument. `label` holds the dominant-language
 * name for a banner; `plaque` holds the composed digit string for scalar motifs.
 */
export type MuralMotif = {
  dimension: StrengthDimension;
  kind: MuralMotifKind;
  tier: StrengthScore['tier'];
  x: number;
  width: number;
  baselineY: number;
  count: number;
  standout: boolean;
  label?: string;
  plaque?: string;
};

/** One present-day badge: a Title-Case strength title, optional digit plaque. */
export type Badge = { label: string; plaque?: string };

/** An era placed on the strip with its geometry, ribbon, and title filled in. */
export type PlacedEra = MuralEra & {
  x: number;
  width: number;
  slots: MuralSlot[];
  ribbon: RibbonColumn[];
  title: string;
  motifs: MuralMotif[];
};

/** The complete pure model of one desert mural, ready for the render layer. */
export type MuralScene = {
  handle: string;
  width: number;
  height: number;
  worldScale: WorldScale;
  eras: PlacedEra[];
  badges: Badge[];
  subtitle: string;
  presentDayLabel: string;
  accessibleTitle: string;
  accessibleDescription: string;
};
