import type { MuralTier } from '../mural-scene.js';
import type { ModuleFill } from '../mural-vocabulary.js';

/** The mural's three style families, in frozen append-only order (the hash default depends on it). */
export type WorldName = 'desert' | 'river' | 'mountain';

/** Ascending-offset stops for the one sky gradient the mural draws (§6.9). */
export type SkyStops = readonly { offset: number; color: string }[];

/** A normalized-box module drawing (x 0..1, y 0..-heightScale), standing on y=0. */
export type WorldModule = (opts: { fill: ModuleFill; heightScale: number }) => string;

/**
 * Everything a world contributes to a render: pure taste, never a signal about the user.
 * Same scene data reads the same in every world; only these colors and the two signature
 * silhouettes change. Shared geometry (bands, outline, typography, budgets) stays in
 * mural-vocabulary — a world never touches it.
 */
export type World = {
  name: WorldName;
  sky: SkyStops;
  distantTerrain: string;
  groundTint: Record<MuralTier, string>;
  structureFill: Record<MuralTier, ModuleFill>;
  spine: { kind: 'road' | 'river'; color: string };
  ribbonRamp: readonly string[];
  goldAccent: string;
  structureBody: string;
  structureAccent: string;
  languageAccent: Record<string, string>;
  languageAccentFallback: string;
  panelFill: string;
  modules: { camp: WorldModule; prop: WorldModule };
};
