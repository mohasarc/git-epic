import { describe, expect, it } from 'vitest';

import { detectChapters } from '../chapters/detect-chapters.js';
import { narrateChapter } from '../narration/narrate-chapter.js';
import { scoreStrengths, type StrengthScore, type StrengthsResult } from '../strengths/score-strengths.js';
import type { StrengthDimension } from '../strengths/strength-dimensions.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { buildMuralScene } from './build-mural-scene.js';
import { compactCount } from './compact-count.js';
import type { PlacedEra } from './mural-scene.js';
import { MAX_BOULEVARD_BANNERS, placeMotifs } from './place-motifs.js';

function inputsFor(fixtureFileName: string): { eras: PlacedEra[]; strengths: StrengthsResult } {
  const snapshot = loadHistorySnapshotFixture(fixtureFileName);
  const strengths = scoreStrengths(snapshot);
  const narratedChapters = detectChapters(snapshot).map((chapter) => ({
    chapter,
    narration: narrateChapter(chapter),
  }));
  return { eras: buildMuralScene(snapshot, narratedChapters, strengths).eras, strengths };
}

function motifsFor(fixtureFileName: string) {
  const { eras, strengths } = inputsFor(fixtureFileName);
  return placeMotifs(eras, strengths).flatMap((era) => era.motifs);
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

describe('placeMotifs per-profile shapes', () => {
  it('gives star-heavy a standout crownGate with a star plaque in the widest era', () => {
    const { eras, strengths } = inputsFor('star-heavy-account.json');
    const placed = placeMotifs(eras, strengths);
    const motifs = placed.flatMap((era) => era.motifs);

    const gate = motifs.find((motif) => motif.kind === 'crownGate');
    expect(gate?.standout).toBe(true);
    expect(gate?.plaque).toBe(`${compactCount(rawValueOf(strengths, 'stars'))} ★`);

    const widestWidth = Math.max(...placed.map((era) => era.width));
    const standoutEra = placed.find((era) => era.motifs.some((motif) => motif.standout));
    expect(standoutEra?.width).toBe(widestWidth);
  });

  it('gives pr-heavy a bridge carrying its PR count', () => {
    const { eras, strengths } = inputsFor('pr-heavy-account.json');
    const bridge = placeMotifs(eras, strengths)
      .flatMap((era) => era.motifs)
      .find((motif) => motif.kind === 'bridge');

    expect(bridge?.plaque).toBe(`${compactCount(rawValueOf(strengths, 'pullRequests'))} PRs`);
  });

  it('gives polyglot a boulevard banner clamped to the banner cap with an over-cap plaque', () => {
    const { eras, strengths } = inputsFor('polyglot-account.json');
    const distinct = rawValueOf(strengths, 'languageBreadth');
    const banner = placeMotifs(eras, strengths)
      .flatMap((era) => era.motifs)
      .find((motif) => motif.kind === 'banner');

    expect(distinct).toBeGreaterThan(MAX_BOULEVARD_BANNERS);
    expect(banner?.count).toBe(Math.min(distinct, MAX_BOULEVARD_BANNERS));
    expect(banner?.plaque).toBe(`${compactCount(distinct)} languages`);
  });

  it('gives a modest account at least one motif', () => {
    expect(motifsFor('modest-account.json').length).toBeGreaterThanOrEqual(1);
  });
});

describe('placeMotifs grace floor', () => {
  for (const fixtureFileName of ['brand-new-account.json', 'single-contribution-account.json']) {
    it(`gives ${fixtureFileName} exactly one plaque-free motif in the present-day era`, () => {
      const { eras, strengths } = inputsFor(fixtureFileName);
      const placed = placeMotifs(eras, strengths);

      const hosting = placed.filter((era) => era.motifs.length > 0);
      expect(hosting).toHaveLength(1);
      expect(hosting[0]).toBe(placed[placed.length - 1]);
      expect(hosting[0].motifs).toHaveLength(1);
      expect(hosting[0].motifs[0].plaque).toBeUndefined();
      expect(hosting[0].motifs[0].standout).toBe(false);
    });
  }
});

describe('placeMotifs boulevard banner cap', () => {
  it('clamps atoms to the cap and plaques the true count above it', () => {
    const strengths = makeStrengths({ languageBreadth: { tier: 1, reach: 0.3, rawValue: 9 } });
    const banner = placeMotifs([fakeEra(0, 300)], strengths)
      .flatMap((era) => era.motifs)
      .find((motif) => motif.kind === 'banner');

    expect(banner?.count).toBe(MAX_BOULEVARD_BANNERS);
    expect(banner?.plaque).toBe('9 languages');
  });

  it('draws one banner per language and no plaque at or below the cap', () => {
    const strengths = makeStrengths({ languageBreadth: { tier: 1, reach: 0.3, rawValue: 6 } });
    const banner = placeMotifs([fakeEra(0, 300)], strengths)
      .flatMap((era) => era.motifs)
      .find((motif) => motif.kind === 'banner');

    expect(banner?.count).toBe(6);
    expect(banner?.plaque).toBeUndefined();
  });
});

describe('placeMotifs spike monument', () => {
  it('fires a single standout when a dimension clears the baseline gap by two', () => {
    const strengths = makeStrengths({
      stars: { tier: 2, reach: 0.5, rawValue: 100 },
      pullRequests: { tier: 1, reach: 0.3, rawValue: 10 },
    });
    const motifs = placeMotifs([fakeEra(0, 240), fakeEra(240, 200)], strengths).flatMap(
      (era) => era.motifs,
    );

    const standouts = motifs.filter((motif) => motif.standout);
    expect(standouts).toHaveLength(1);
    expect(standouts[0].dimension).toBe('stars');
  });

  it('does not fire when the widest gap is only one tier', () => {
    const strengths = makeStrengths({
      stars: { tier: 1, reach: 0.3, rawValue: 40 },
      pullRequests: { tier: 1, reach: 0.2, rawValue: 10 },
    });
    const motifs = placeMotifs([fakeEra(0, 240), fakeEra(240, 200)], strengths).flatMap(
      (era) => era.motifs,
    );

    expect(motifs.some((motif) => motif.standout)).toBe(false);
    expect(motifs.length).toBeGreaterThanOrEqual(1);
  });
});

describe('placeMotifs geometry', () => {
  it('lays motifs into non-overlapping lanes inside each era span', () => {
    const { eras, strengths } = inputsFor('pr-heavy-account.json');
    const placed = placeMotifs(eras, strengths);

    for (const era of placed) {
      const ordered = [...era.motifs].sort((a, b) => a.x - b.x);
      for (const motif of ordered) {
        expect(motif.x).toBeGreaterThanOrEqual(era.x - 1e-6);
        expect(motif.x + motif.width).toBeLessThanOrEqual(era.x + era.width + 1e-6);
      }
      for (let index = 0; index + 1 < ordered.length; index++) {
        expect(ordered[index].x + ordered[index].width).toBeLessThanOrEqual(ordered[index + 1].x + 1e-6);
      }
    }
  });

  it('is idempotent and deterministic', () => {
    const { eras, strengths } = inputsFor('star-heavy-account.json');
    const once = placeMotifs(eras, strengths);

    expect(placeMotifs(eras, strengths)).toEqual(once);
    expect(placeMotifs(once, strengths)).toEqual(once);
  });
});
