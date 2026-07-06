import { describe, expect, it } from 'vitest';
import { detectChapters } from '../../chapters/detect-chapters.js';
import { narrateChapter } from '../../narration/narrate-chapter.js';
import { scoreStrengths } from '../../strengths/score-strengths.js';
import { buildHistorySnapshot } from '../../test-support/build-history-snapshot.js';
import { loadHistorySnapshotFixture } from '../../test-support/load-history-snapshot-fixture.js';
import { expectEmbedSafeSvg } from '../../test-support/expect-embed-safe-svg.js';
import type { HistorySnapshot } from '../../history-snapshot.js';
import type { NarratedChapter } from '../../timeline/build-timeline.js';
import { buildMuralScene } from '../build-mural-scene.js';
import type { MuralScene } from '../mural-scene.js';
import { Y_BANDS } from '../mural-vocabulary.js';
import { desert } from '../worlds/desert.js';
import { renderMuralSvg } from '../render-mural-svg.js';
import { renderEraStructures, renderStructures } from './structures.js';

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function scene(snapshot: HistorySnapshot): MuralScene {
  return buildMuralScene(snapshot, narrate(snapshot), scoreStrengths(snapshot));
}

const richScene = scene(loadHistorySnapshotFixture('rich-history-account.json'));
const campScene = scene(
  buildHistorySnapshot({
    handle: 'first-spark',
    firstPublicActivityDate: '2019-03-20',
    contributionDays: [{ date: '2019-03-20', count: 1 }],
  }),
);
const recentCampScene = scene(
  buildHistorySnapshot({
    handle: 'fresh-camp',
    accountCreatedDate: '2026-05-01',
    firstPublicActivityDate: '2026-05-04',
    contributionDays: [
      { date: '2026-05-04', count: 2 },
      { date: '2026-06-10', count: 1 },
      { date: '2026-06-28', count: 3 },
    ],
  }),
);

function moduleGroups(svg: string): string[] {
  return svg.match(/<g transform="translate\([^)]*\) scale\([^)]*\)">/g) ?? [];
}

function baselineYs(svg: string): number[] {
  return [...svg.matchAll(/translate\([-\d.]+,([-\d.]+)\) scale\(/g)].map((match) => Number(match[1]));
}

function maxScaleY(svg: string): number {
  return Math.max(...[...svg.matchAll(/scale\([-\d.]+,([-\d.]+)\)/g)].map((match) => Number(match[1])));
}

function totalSlots(built: MuralScene): number {
  return built.eras.reduce((count, era) => count + era.slots.length, 0);
}

describe('renderStructures slot fill', () => {
  it('fills every allocated slot with a translate/scale-wrapped module', () => {
    const svg = renderStructures(richScene.eras, richScene.worldScale, desert);
    expect(moduleGroups(svg)).toHaveLength(totalSlots(richScene));
  });

  it('stands every module on the road baseline', () => {
    const svg = renderStructures(richScene.eras, richScene.worldScale, desert);
    const ys = baselineYs(svg);
    expect(ys.length).toBe(totalSlots(richScene));
    expect(ys.every((y) => y === Y_BANDS.roadBaseline)).toBe(true);
  });

  it('appears inside the full mural strip', () => {
    const svg = renderMuralSvg(richScene);
    expect(svg).toContain(renderStructures(richScene.eras, richScene.worldScale, desert));
  });
});

describe('renderEraStructures per-era accessor', () => {
  it('composes into renderStructures byte-identically', () => {
    expect(richScene.eras.map((era) => renderEraStructures(era, richScene.worldScale, desert)).join('')).toBe(
      renderStructures(richScene.eras, richScene.worldScale, desert),
    );
  });

  it('renders one era as a substring of the full layer', () => {
    const era = richScene.eras.find((candidate) => candidate.slots.length > 0)!;
    const fragment = renderEraStructures(era, richScene.worldScale, desert);
    expect(fragment).not.toBe('');
    expect(renderStructures(richScene.eras, richScene.worldScale, desert)).toContain(fragment);
  });
});

describe('renderStructures tier palette and world scale', () => {
  it('colors modules by their era tier', () => {
    const tiers = new Set(richScene.eras.map((era) => era.tier));
    const svg = renderStructures(richScene.eras, richScene.worldScale, desert);
    for (const tier of tiers) {
      expect(svg).toContain(desert.structureFill[tier].body);
    }
    expect(tiers.size).toBeGreaterThan(1);
  });

  it('makes a metropolis denser and taller than a camp', () => {
    const metropolis = renderStructures(richScene.eras, richScene.worldScale, desert);
    const camp = renderStructures(campScene.eras, campScene.worldScale, desert);
    expect(richScene.worldScale).toBe('metropolis');
    expect(campScene.worldScale).toBe('camp');
    expect(moduleGroups(metropolis).length).toBeGreaterThan(moduleGroups(camp).length);
    expect(maxScaleY(metropolis)).toBeGreaterThan(maxScaleY(camp));
  });
});

describe('renderStructures grace floor', () => {
  it('renders a visible camp with a tent and a marker, never an empty era', () => {
    const svg = renderStructures(campScene.eras, campScene.worldScale, desert);
    expect(moduleGroups(svg).length).toBeGreaterThanOrEqual(campScene.eras.length);
    expect(svg).toContain('0,0 1,0 0.5,-1');
    expect(svg).toContain('x="0.4"');
  });
});

describe('renderStructures no small-account decay', () => {
  it('emits only palette fills for a low-scale scene without a dark-age chapter', () => {
    expect(recentCampScene.worldScale).toBe('camp');
    expect(recentCampScene.eras.every((era) => era.chapter?.kind !== 'dark-age')).toBe(true);
    const svg = renderStructures(recentCampScene.eras, recentCampScene.worldScale, desert);
    const tiers = new Set(recentCampScene.eras.map((era) => era.tier));
    const allowed = new Set<string>();
    for (const tier of tiers) {
      allowed.add(desert.structureFill[tier].body);
      if (desert.structureFill[tier].accent !== undefined) allowed.add(desert.structureFill[tier].accent as string);
    }
    const fills = [...svg.matchAll(/fill="([^"]*)"/g)].map((match) => match[1]);
    expect(fills.length).toBeGreaterThan(0);
    expect(fills.every((fill) => allowed.has(fill))).toBe(true);
  });
});

describe('renderStructures embed safety', () => {
  it('keeps the full strip embed-safe', () => {
    expectEmbedSafeSvg(renderMuralSvg(richScene));
  });
});
