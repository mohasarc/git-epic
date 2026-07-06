import { describe, expect, it } from 'vitest';
import { detectChapters } from '../../chapters/detect-chapters.js';
import { narrateChapter } from '../../narration/narrate-chapter.js';
import { scoreStrengths } from '../../strengths/score-strengths.js';
import { loadHistorySnapshotFixture } from '../../test-support/load-history-snapshot-fixture.js';
import type { HistorySnapshot } from '../../history-snapshot.js';
import type { NarratedChapter } from '../../timeline/build-timeline.js';
import { buildMuralScene } from '../build-mural-scene.js';
import type { MuralScene } from '../mural-scene.js';
import { SEAM_FEATHER_WIDTH } from '../mural-vocabulary.js';
import { desert } from '../worlds/desert.js';
import { renderDistantBand, renderEraGround, renderTerrain } from './terrain.js';

type GroundRect = { left: number; right: number };

function groundRects(svg: string): GroundRect[] {
  const pattern = /<g transform="translate\(([-\d.]+),0\)"><rect x="([-\d.]+)" y="[-\d.]+" width="([-\d.]+)"/g;
  return [...svg.matchAll(pattern)].map((match) => {
    const translateX = Number(match[1]);
    const left = translateX + Number(match[2]);
    return { left, right: left + Number(match[3]) };
  });
}

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
      renderDistantBand(richScene.width, desert) + renderEraGround(0, richScene.width, richScene.eras, desert),
    );
  });

  it('renders the distant band as a single full-width backdrop rect', () => {
    const band = renderDistantBand(richScene.width, desert);
    expect(band).toMatch(/^<rect /);
    expect(band).toContain(`width="${richScene.width}"`);
  });

  it('renders one era-ground group per era', () => {
    const ground = renderEraGround(0, richScene.width, richScene.eras, desert);
    expect(ground.match(/<g transform="translate\(/g)).toHaveLength(richScene.eras.length);
  });
});

describe('renderEraGround bounds', () => {
  it('spans exactly [0, width] with full-strip bounds', () => {
    const rects = groundRects(renderEraGround(0, richScene.width, richScene.eras, desert));
    expect(rects[0].left).toBe(0);
    expect(rects[rects.length - 1].right).toBe(richScene.width);
  });

  it('pins the edge rects to explicit row bounds without overrun', () => {
    const [first, ...rest] = richScene.eras;
    const rowEras = [first, ...rest.slice(0, 1)];
    const leftX = rowEras[0].x;
    const rightX = rowEras[rowEras.length - 1].x + rowEras[rowEras.length - 1].width;
    const rects = groundRects(renderEraGround(leftX, rightX, rowEras, desert));
    expect(rects[0].left).toBe(leftX);
    expect(rects[rects.length - 1].right).toBe(rightX);
    for (const rect of rects) {
      expect(rect.left).toBeGreaterThanOrEqual(leftX);
      expect(rect.right).toBeLessThanOrEqual(rightX + SEAM_FEATHER_WIDTH);
    }
  });

  it('keeps interior seam overrun on the middle eras', () => {
    const rects = groundRects(renderEraGround(0, richScene.width, richScene.eras, desert));
    const secondEra = richScene.eras[1];
    expect(rects[1].right).toBeCloseTo(secondEra.x + secondEra.width + SEAM_FEATHER_WIDTH, 2);
  });
});
