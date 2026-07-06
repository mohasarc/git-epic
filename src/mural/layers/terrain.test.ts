import { describe, expect, it } from 'vitest';
import { detectChapters } from '../../chapters/detect-chapters.js';
import { narrateChapter } from '../../narration/narrate-chapter.js';
import { scoreStrengths } from '../../strengths/score-strengths.js';
import { loadHistorySnapshotFixture } from '../../test-support/load-history-snapshot-fixture.js';
import type { HistorySnapshot } from '../../history-snapshot.js';
import type { NarratedChapter } from '../../timeline/build-timeline.js';
import { buildMuralScene } from '../build-mural-scene.js';
import type { MuralScene } from '../mural-scene.js';
import { desert } from '../worlds/desert.js';
import { renderDistantBand, renderEraGround, renderTerrain } from './terrain.js';

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function scene(snapshot: HistorySnapshot): MuralScene {
  return buildMuralScene(snapshot, narrate(snapshot), scoreStrengths(snapshot));
}

const richScene = scene(loadHistorySnapshotFixture('rich-history-account.json'));

describe('renderTerrain composition', () => {
  it('is the distant band followed by the era ground, byte-identical', () => {
    expect(renderTerrain(richScene.width, richScene.eras, desert)).toBe(
      renderDistantBand(richScene.width, desert) + renderEraGround(richScene.width, richScene.eras, desert),
    );
  });

  it('renders the distant band as a single full-width backdrop rect', () => {
    const band = renderDistantBand(richScene.width, desert);
    expect(band).toMatch(/^<rect /);
    expect(band).toContain(`width="${richScene.width}"`);
  });

  it('renders one era-ground group per era', () => {
    const ground = renderEraGround(richScene.width, richScene.eras, desert);
    expect(ground.match(/<g transform="translate\(/g)).toHaveLength(richScene.eras.length);
  });
});
