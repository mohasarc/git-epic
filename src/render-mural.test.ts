import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { detectChapters } from './chapters/detect-chapters.js';
import * as publicApi from './index.js';
import { narrateChapter } from './narration/narrate-chapter.js';
import { renderEpic } from './render-epic.js';
import { renderMural } from './render-mural.js';
import { buildMuralScene } from './mural/build-mural-scene.js';
import { CAMERA_WINDOW_WIDTH, MURAL_HEIGHT } from './mural/mural-vocabulary.js';
import { scoreStrengths } from './strengths/score-strengths.js';
import type { HistorySnapshot } from './history-snapshot.js';
import type { NarratedChapter } from './timeline/build-timeline.js';
import { buildHistorySnapshot } from './test-support/build-history-snapshot.js';
import { expectEmbedSafeSvg } from './test-support/expect-embed-safe-svg.js';
import { loadHistorySnapshotFixture } from './test-support/load-history-snapshot-fixture.js';

const muralFixtureFileNames = [
  'rich-history-account.json',
  'single-contribution-account.json',
  'brand-new-account.json',
  'fifteen-year-overflow.json',
  'modest-account.json',
];

function animatedExampleSvg(fileName: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../examples/stage-3-phase-8/${fileName}`, import.meta.url)),
    'utf8',
  );
}

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function scene(snapshot: HistorySnapshot) {
  return buildMuralScene(snapshot, narrate(snapshot), scoreStrengths(snapshot));
}

describe('renderMural', () => {
  for (const fixtureFileName of muralFixtureFileNames) {
    it(`renders a complete strip for ${fixtureFileName}`, () => {
      const snapshot = loadHistorySnapshotFixture(fixtureFileName);
      const svg = renderMural(snapshot);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
      expect(svg).toContain(`viewBox="0 0 ${CAMERA_WINDOW_WIDTH} ${MURAL_HEIGHT}"`);
      expect(svg).toContain(`The Epic of ${snapshot.handle}`);
      expectEmbedSafeSvg(svg);
    });

    it(`renders byte-identical output across separately loaded snapshots for ${fixtureFileName}`, () => {
      const first = renderMural(loadHistorySnapshotFixture(fixtureFileName));
      const second = renderMural(loadHistorySnapshotFixture(fixtureFileName));
      expect(first === second).toBe(true);
    });
  }

  it('matches the committed animated golden for the rich history fixture', () => {
    const svg = renderMural(loadHistorySnapshotFixture('rich-history-account.json'));
    expect(svg).toBe(animatedExampleSvg('rich-history-account.svg'));
  });

  it('leaves the cosmic render byte-identical to its existing golden', () => {
    const cosmicGolden = readFileSync(
      fileURLToPath(new URL('../examples/stage-3-phase-5/rich-history-account.svg', import.meta.url)),
      'utf8',
    );
    expect(renderEpic(loadHistorySnapshotFixture('rich-history-account.json'))).toBe(cosmicGolden);
  });

  it('renders genuinely similar snapshots as similar strips', () => {
    const base = loadHistorySnapshotFixture('modest-account.json');
    const nearTwin: HistorySnapshot = { ...base, followerCount: base.followerCount + 2 };

    const baseScene = scene(base);
    const twinScene = scene(nearTwin);

    expect(twinScene.worldScale).toBe(baseScene.worldScale);
    expect(twinScene.eras).toHaveLength(baseScene.eras.length);
    const slotCount = (s: ReturnType<typeof scene>) =>
      s.eras.reduce((total, era) => total + era.slots.length, 0);
    expect(Math.abs(slotCount(twinScene) - slotCount(baseScene))).toBeLessThanOrEqual(2);
  });
});

describe('mural entry point', () => {
  it('exports renderMural alongside the cosmic surface', () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      'WORLD_NAMES',
      'detectChapters',
      'narrateChapter',
      'renderEpic',
      'renderMural',
      'scoreStrengths',
    ]);
    expect(publicApi.renderMural(buildHistorySnapshot()).startsWith('<svg')).toBe(true);
  });

  it('exposes the frozen three-world name order', () => {
    expect([...publicApi.WORLD_NAMES]).toEqual(['desert', 'river', 'mountain']);
  });
});

describe('renderMural world selection', () => {
  const fixture = 'rich-history-account.json';

  it('defaults to the desert world', () => {
    const snapshot = loadHistorySnapshotFixture(fixture);
    expect(renderMural(snapshot)).toBe(renderMural(snapshot, 'desert'));
  });

  it('renders river and mountain identical to desert while they alias it', () => {
    const desertSvg = renderMural(loadHistorySnapshotFixture(fixture), 'desert');
    expect(renderMural(loadHistorySnapshotFixture(fixture), 'river')).toBe(desertSvg);
    expect(renderMural(loadHistorySnapshotFixture(fixture), 'mountain')).toBe(desertSvg);
  });
});
