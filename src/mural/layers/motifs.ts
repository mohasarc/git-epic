import { formatSvgNumber } from '../../rendering/format-svg-number.js';
import { bannerModule } from '../modules/banner.js';
import { bridgeModule } from '../modules/bridge.js';
import { crowdModule } from '../modules/crowd.js';
import { crownGateModule } from '../modules/crown-gate.js';
import { noticeBoardModule } from '../modules/notice-board.js';
import { sideRoadModule } from '../modules/side-road.js';
import type { MuralMotif, MuralMotifKind, PlacedEra, WorldScale } from '../mural-scene.js';
import {
  GOLD_ACCENT,
  LANGUAGE_ACCENT,
  MURAL_PALETTE,
  type ModuleFill,
} from '../mural-vocabulary.js';
import { svgText } from './svg-text.js';

/** Height a single-atom motif stands at tier 0, by world scale; tier lifts it from here. */
const MOTIF_HEIGHT: Record<WorldScale, number> = { camp: 34, town: 54, metropolis: 74 };
/** Each tier adds this fraction of the base height to a scale-driven motif. */
const TIER_HEIGHT_STEP = 0.16;
/** The spike monument stands this much taller than a same-tier neighbor. */
const STANDOUT_SCALE = 1.5;
const PLAQUE_GAP = 5;
const PLAQUE_FONT_SIZE = 9;

type MotifModule = (opts: { fill: ModuleFill; heightScale: number }) => string;

const MODULE_BY_KIND: Record<MuralMotifKind, MotifModule> = {
  banner: bannerModule,
  crownGate: crownGateModule,
  sideRoad: sideRoadModule,
  crowd: crowdModule,
  bridge: bridgeModule,
  noticeBoard: noticeBoardModule,
};

/** Crowd and boulevard banner express tier as repeated atoms; the rest scale one atom by tier. */
const COUNT_ATOM_KINDS = new Set<MuralMotifKind>(['crowd', 'banner']);

/**
 * Draw the strength motifs placed inside each era. Color is decided here (per Stage 1):
 * the star gate and the spike monument take gold; a banner takes its language accent, or
 * the neutral accent for an unknown language. Count-atom kinds repeat left-to-right within
 * their lane; scale-driven kinds grow one atom by tier. Plaques ride above each motif.
 */
export function renderMotifs(eras: PlacedEra[], worldScale: WorldScale): string {
  return eras.map((era) => renderEraMotifs(era, worldScale)).join('');
}

export function renderEraMotifs(era: PlacedEra, worldScale: WorldScale): string {
  return era.motifs.map((motif) => renderMotif(motif, worldScale)).join('');
}

export function renderMotif(motif: MuralMotif, worldScale: WorldScale): string {
  const height = motifHeight(motif, worldScale);
  const module = MODULE_BY_KIND[motif.kind];
  const fill = motifFill(motif);
  const shapes = COUNT_ATOM_KINDS.has(motif.kind)
    ? renderAtoms(motif, height, module, fill)
    : renderAtom(module, motif.x, motif.width, motif.baselineY, height, fill);
  return shapes + renderPlaque(motif, height);
}

function motifHeight(motif: MuralMotif, worldScale: WorldScale): number {
  const base = MOTIF_HEIGHT[worldScale];
  const standout = motif.standout ? STANDOUT_SCALE : 1;
  if (COUNT_ATOM_KINDS.has(motif.kind)) return base * standout;
  return base * (1 + motif.tier * TIER_HEIGHT_STEP) * standout;
}

function renderAtoms(motif: MuralMotif, height: number, module: MotifModule, fill: ModuleFill): string {
  const count = Math.max(1, motif.count);
  const atomWidth = motif.width / count;
  let out = '';
  for (let index = 0; index < count; index++) {
    out += renderAtom(module, motif.x + index * atomWidth, atomWidth, motif.baselineY, height, fill);
  }
  return out;
}

function renderAtom(
  module: MotifModule,
  x: number,
  width: number,
  baselineY: number,
  height: number,
  fill: ModuleFill,
): string {
  return (
    `<g transform="translate(${formatSvgNumber(x)},${formatSvgNumber(baselineY)}) scale(${formatSvgNumber(width)},${formatSvgNumber(height)})">` +
    module({ fill, heightScale: 1 }) +
    `</g>`
  );
}

function renderPlaque(motif: MuralMotif, height: number): string {
  if (!motif.plaque) return '';
  const y = motif.baselineY - height - PLAQUE_GAP;
  return svgText(motif.plaque, motif.x + motif.width / 2, y, {
    fontSize: PLAQUE_FONT_SIZE,
    anchor: 'middle',
    letterSpacing: 0.5,
  });
}

function motifFill(motif: MuralMotif): ModuleFill {
  if (motif.standout || motif.kind === 'crownGate') {
    return { body: GOLD_ACCENT, accent: MURAL_PALETTE.structureAccent };
  }
  if (motif.kind === 'banner') {
    // A labelled banner is the recurring dominant-language banner; its language name is
    // attached to eras upstream when Phase 9 wires placeMotifs into the scene. Until then
    // (like every motif here) it only reaches the render through a manual placeMotifs call.
    const body = (motif.label && LANGUAGE_ACCENT[motif.label]) ?? MURAL_PALETTE.structureAccent;
    return { body, accent: MURAL_PALETTE.structureAccent };
  }
  return { body: MURAL_PALETTE.structureBody, accent: MURAL_PALETTE.structureAccent };
}
