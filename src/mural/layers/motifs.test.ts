import { describe, expect, it } from 'vitest';
import { detectChapters } from '../../chapters/detect-chapters.js';
import { narrateChapter } from '../../narration/narrate-chapter.js';
import { scoreStrengths, type StrengthScore, type StrengthsResult } from '../../strengths/score-strengths.js';
import type { StrengthDimension } from '../../strengths/strength-dimensions.js';
import { loadHistorySnapshotFixture } from '../../test-support/load-history-snapshot-fixture.js';
import { expectEmbedSafeSvg } from '../../test-support/expect-embed-safe-svg.js';
import type { HistorySnapshot } from '../../history-snapshot.js';
import type { NarratedChapter } from '../../timeline/build-timeline.js';
import { buildMuralScene } from '../build-mural-scene.js';
import { compactCount } from '../compact-count.js';
import type { MuralMotif, MuralScene, PlacedEra, WorldScale } from '../mural-scene.js';
import { GOLD_ACCENT, LANGUAGE_ACCENT, MURAL_PALETTE } from '../mural-vocabulary.js';
import { placeMotifs } from '../place-motifs.js';
import { renderMuralSvg } from '../render-mural-svg.js';
import { renderMotifs } from './motifs.js';
import { renderRibbon } from './ribbon.js';
import { renderStructures } from './structures.js';

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function scene(fixtureFileName: string): { scene: MuralScene; strengths: StrengthsResult } {
  const snapshot = loadHistorySnapshotFixture(fixtureFileName);
  const strengths = scoreStrengths(snapshot);
  return { scene: buildMuralScene(snapshot, narrate(snapshot), strengths), strengths };
}

function rawValueOf(strengths: StrengthsResult, dimension: StrengthDimension): number {
  return strengths.ranked.find((score) => score.dimension === dimension)!.rawValue;
}

const ZERO_DIMENSIONS: StrengthDimension[] = [
  'projectCount',
  'stars',
  'forks',
  'followers',
  'pullRequests',
  'issues',
  'languageBreadth',
  'activityVolume',
];

function makeStrengths(
  overrides: Partial<Record<StrengthDimension, { tier: StrengthScore['tier']; reach: number; rawValue: number }>>,
): StrengthsResult {
  const ranked: StrengthScore[] = ZERO_DIMENSIONS.map((dimension) => {
    const override = overrides[dimension];
    return {
      dimension,
      tier: override?.tier ?? 0,
      reach: override?.reach ?? 0,
      rawValue: override?.rawValue ?? 0,
    };
  }).sort((a, b) => b.reach - a.reach);
  return { ranked, topDimension: ranked[0], unavailable: [], dominantLanguage: null };
}

function fakeEra(x: number, width: number): PlacedEra {
  return {
    chapter: null,
    startDate: '2020-01-01',
    endDate: '2020-06-01',
    tier: 'modern',
    x,
    width,
    slots: [],
    ribbon: [],
    title: '',
    motifs: [],
  };
}

function renderMotif(motif: MuralMotif, worldScale: WorldScale): string {
  return renderMotifs([{ ...fakeEra(0, 300), motifs: [motif] }], worldScale);
}

function atomGroups(svg: string): string[] {
  return svg.match(/<g transform="translate\([^)]*\) scale\([^)]*\)">/g) ?? [];
}

function maxScaleY(svg: string): number {
  return Math.max(...[...svg.matchAll(/scale\([-\d.]+,([-\d.]+)\)/g)].map((match) => Number(match[1])));
}

function crowdMotif(standout: boolean): MuralMotif {
  return {
    dimension: 'followers',
    kind: 'crowd',
    tier: 2,
    x: 20,
    width: 120,
    baselineY: 300,
    count: 4,
    standout,
  };
}

function labelledBanner(label: string): MuralMotif {
  return {
    dimension: 'languageBreadth',
    kind: 'banner',
    tier: 1,
    x: 20,
    width: 40,
    baselineY: 200,
    count: 1,
    standout: false,
    label,
  };
}

describe('renderMotifs per-profile shapes', () => {
  it('draws a gold standout and its star plaque for a star-heavy account', () => {
    const { scene: built, strengths } = scene('star-heavy-account.json');
    const placed = placeMotifs(built.eras, strengths);
    const svg = renderMotifs(placed, built.worldScale);

    expect(placed.flatMap((era) => era.motifs).some((motif) => motif.standout)).toBe(true);
    expect(svg).toContain(GOLD_ACCENT);
    expect(svg).toContain(`${compactCount(rawValueOf(strengths, 'stars'))} ★`);
  });

  it('draws exactly min(count, 6) crowd atoms for a follower-heavy account', () => {
    const strengths = makeStrengths({ followers: { tier: 2, reach: 0.6, rawValue: 40 } });
    const placed = placeMotifs([fakeEra(0, 300)], strengths);
    const svg = renderMotifs(placed, 'town');

    expect(atomGroups(svg)).toHaveLength(6);
  });

  it('draws min(distinctLanguages, 8) banner atoms for a polyglot account', () => {
    const strengths = makeStrengths({ languageBreadth: { tier: 2, reach: 0.5, rawValue: 9 } });
    const placed = placeMotifs([fakeEra(0, 300)], strengths);
    const svg = renderMotifs(placed, 'town');

    expect(atomGroups(svg)).toHaveLength(8);
  });

  it('scales a count-atom spike monument taller than its plain twin', () => {
    const standout = renderMotif(crowdMotif(true), 'town');
    const plain = renderMotif(crowdMotif(false), 'town');

    expect(maxScaleY(standout)).toBeGreaterThan(maxScaleY(plain));
    expect(standout).toContain(GOLD_ACCENT);
  });
});

// The dominant-language banner's language name is attached to eras upstream when Phase 9
// wires placeMotifs into the scene; these tests feed a labelled banner directly to pin the
// render layer's accent lookup, the capability that recurrence will use.
describe('renderMotifs accent lookup', () => {
  it('colors a dominant-language banner with its language accent', () => {
    const svg = renderMotif(labelledBanner('TypeScript'), 'town');
    expect(svg).toContain(LANGUAGE_ACCENT.TypeScript);
  });

  it('falls back to the neutral accent for an unknown language', () => {
    const svg = renderMotif(labelledBanner('Brainfuck'), 'town');
    expect(svg).not.toContain(LANGUAGE_ACCENT.TypeScript);
    expect(svg).toContain(MURAL_PALETTE.structureAccent);
  });
});

describe('renderMotifs layer order', () => {
  it('appears after structures and before the ribbon in the full strip', () => {
    const { scene: built, strengths } = scene('rich-history-account.json');
    const placed: MuralScene = { ...built, eras: placeMotifs(built.eras, strengths) };
    const svg = renderMuralSvg(placed);

    const motifs = renderMotifs(placed.eras, placed.worldScale);
    const structures = renderStructures(placed.eras, placed.worldScale);
    const ribbon = renderRibbon(placed.eras, placed.width);

    expect(motifs).not.toBe('');
    expect(svg.indexOf(motifs)).toBeGreaterThan(svg.indexOf(structures));
    expect(svg.indexOf(motifs)).toBeLessThan(svg.indexOf(ribbon));
  });
});

describe('renderMotifs escaping', () => {
  it('escapes an XML-hostile plaque and label', () => {
    const motif: MuralMotif = {
      ...labelledBanner('"><g onload="x">'),
      plaque: '<script>alert(1)</script> & "42"',
    };
    expectEmbedSafeSvg(renderMotif(motif, 'town'));
  });
});
