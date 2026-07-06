import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { detectChapters } from '../chapters/detect-chapters.js';
import { narrateChapter } from '../narration/narrate-chapter.js';
import { renderEpic } from '../render-epic.js';
import { renderMural } from '../render-mural.js';
import { scoreStrengths } from '../strengths/score-strengths.js';
import type { StrengthDimension } from '../strengths/strength-dimensions.js';
import { expectEmbedSafeSvg } from '../test-support/expect-embed-safe-svg.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import type { HistorySnapshot } from '../history-snapshot.js';
import type { NarratedChapter } from '../timeline/build-timeline.js';
import { buildMuralScene } from './build-mural-scene.js';
import type { MuralScene } from './mural-scene.js';
import { MURAL_BYTE_CEILING } from './mural-vocabulary.js';
import { renderMuralSvg } from './render-mural-svg.js';

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function sceneFor(snapshot: HistorySnapshot): MuralScene {
  return buildMuralScene(snapshot, narrate(snapshot), scoreStrengths(snapshot));
}

function motifsOf(scene: MuralScene) {
  return scene.eras.flatMap((era) => era.motifs);
}

/** The kind of the motif for the account's strongest motif-bearing dimension. */
function topMotifKind(snapshot: HistorySnapshot): string | undefined {
  const rankIndex = new Map<StrengthDimension, number>(
    scoreStrengths(snapshot).ranked.map((score, index) => [score.dimension, index]),
  );
  const [top] = motifsOf(sceneFor(snapshot))
    .slice()
    .sort((a, b) => (rankIndex.get(a.dimension) ?? 0) - (rankIndex.get(b.dimension) ?? 0));
  return top?.kind;
}

function leadBadge(snapshot: HistorySnapshot): string | undefined {
  return sceneFor(snapshot).badges[0]?.label;
}

function byteSize(svg: string): number {
  return Buffer.byteLength(svg, 'utf8');
}

// Engineered in Phase 2 to land in three distinct cells; modest and rich are organic.
const CALIBRATED_PROFILES = ['polyglot-account.json', 'star-heavy-account.json', 'pr-heavy-account.json'];

describe('strengths integration — cross-profile differentiation', () => {
  it('gives each calibrated profile a distinct top motif and lead badge', () => {
    const signatures = CALIBRATED_PROFILES.map((fixture) => {
      const snapshot = loadHistorySnapshotFixture(fixture);
      return { kind: topMotifKind(snapshot), lead: leadBadge(snapshot) };
    });

    const kinds = signatures.map((signature) => signature.kind);
    const leads = signatures.map((signature) => signature.lead);

    expect(kinds.every(Boolean)).toBe(true);
    expect(leads.every(Boolean)).toBe(true);
    expect(new Set(kinds).size).toBe(kinds.length);
    expect(new Set(leads).size).toBe(leads.length);
  });

  // modest is language-dominant by its real data, sharing polyglot's cell — distinctness
  // comes from data, never manufactured. It still reads apart from the scalar-heavy profiles.
  it('sets modest apart from the scalar-heavy profiles on both motif and badge', () => {
    const modestKind = topMotifKind(loadHistorySnapshotFixture('modest-account.json'));
    const modestLead = leadBadge(loadHistorySnapshotFixture('modest-account.json'));

    for (const fixture of ['star-heavy-account.json', 'pr-heavy-account.json']) {
      expect(modestKind).not.toBe(topMotifKind(loadHistorySnapshotFixture(fixture)));
      expect(modestLead).not.toBe(leadBadge(loadHistorySnapshotFixture(fixture)));
    }
  });
});

describe('strengths integration — never shaming', () => {
  it('emits no motif for a tier-0 dimension on a rich profile', () => {
    const snapshot = loadHistorySnapshotFixture('rich-history-account.json');
    const tierOf = new Map<StrengthDimension, number>(
      scoreStrengths(snapshot).ranked.map((score) => [score.dimension, score.tier]),
    );

    for (const motif of motifsOf(sceneFor(snapshot))) {
      expect(tierOf.get(motif.dimension)).toBeGreaterThanOrEqual(1);
    }
  });

  it('titles no badge after a tier-0 weak dimension on a rich profile', () => {
    const snapshot = loadHistorySnapshotFixture('rich-history-account.json');
    const strengths = scoreStrengths(snapshot);
    const tierZeroTitles: Record<StrengthDimension, string> = {
      projectCount: 'Prolific Builder',
      stars: 'Star Magnet',
      forks: 'Widely Forked',
      followers: 'Followed',
      pullRequests: 'Heavy PR Contributor',
      issues: 'Diligent Reporter',
      languageBreadth: 'Polyglot Explorer',
      activityVolume: 'Relentless',
    };
    const labels = new Set(sceneFor(snapshot).badges.map((badge) => badge.label));

    for (const score of strengths.ranked) {
      if (score.tier === 0) expect(labels.has(tierZeroTitles[score.dimension])).toBe(false);
    }
  });
});

describe('strengths integration — feel-good floor', () => {
  it.each(['modest-account.json', 'single-contribution-account.json'])(
    'gives %s at least one motif and one badge',
    (fixture) => {
      const scene = sceneFor(loadHistorySnapshotFixture(fixture));
      expect(motifsOf(scene).length).toBeGreaterThanOrEqual(1);
      expect(scene.badges.length).toBeGreaterThanOrEqual(1);
    },
  );

  it('grace-floors a brand-new account to one hopeful motif and the generic badge', () => {
    const scene = sceneFor(loadHistorySnapshotFixture('brand-new-account.json'));
    expect(motifsOf(scene).length).toBeGreaterThanOrEqual(1);
    expect(scene.badges).toEqual([{ label: 'The Journey Begins' }]);
  });
});

describe('strengths integration — escaping and determinism', () => {
  it('stays embed-safe on a dense render with an XML-hostile handle', () => {
    const snapshot: HistorySnapshot = {
      ...loadHistorySnapshotFixture('rich-history-account.json'),
      handle: '<script>&"\'/',
    };
    expectEmbedSafeSvg(renderMural(snapshot));
  });

  it('re-renders a motif-heavy fixture byte-identically', () => {
    const first = renderMural(loadHistorySnapshotFixture('star-heavy-account.json'));
    const second = renderMural(loadHistorySnapshotFixture('star-heavy-account.json'));
    expect(first).toBe(second);
  });

  it('builds an identical scene for identical inputs on a motif-heavy fixture', () => {
    const snapshot = loadHistorySnapshotFixture('star-heavy-account.json');
    expect(sceneFor(snapshot)).toEqual(sceneFor(snapshot));
  });
});

describe('strengths integration — byte ceiling and non-regression', () => {
  it('keeps the densest strengths render under the static byte ceiling', () => {
    const rich = byteSize(renderMuralSvg(sceneFor(loadHistorySnapshotFixture('rich-history-account.json'))));
    const fifteen = byteSize(
      renderMuralSvg(sceneFor(loadHistorySnapshotFixture('fifteen-year-overflow.json'))),
    );
    expect(rich).toBeLessThan(MURAL_BYTE_CEILING);
    expect(fifteen).toBeLessThan(MURAL_BYTE_CEILING);
  });

  it('leaves the cosmic embed byte-identical to its golden', () => {
    const golden = readFileSync(
      fileURLToPath(new URL('../../examples/stage-3-phase-5/rich-history-account.svg', import.meta.url)),
      'utf8',
    );
    expect(renderEpic(loadHistorySnapshotFixture('rich-history-account.json'))).toBe(golden);
  });
});
