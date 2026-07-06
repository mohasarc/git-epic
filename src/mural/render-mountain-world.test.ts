import { describe, expect, it } from 'vitest';
import { detectChapters } from '../chapters/detect-chapters.js';
import { narrateChapter } from '../narration/narrate-chapter.js';
import { renderMural } from '../render-mural.js';
import { scoreStrengths } from '../strengths/score-strengths.js';
import type { HistorySnapshot } from '../history-snapshot.js';
import type { NarratedChapter } from '../timeline/build-timeline.js';
import { expectEmbedSafeSvg } from '../test-support/expect-embed-safe-svg.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { buildMuralScene } from './build-mural-scene.js';
import {
  MURAL_ANIMATED_BYTE_CEILING,
  MURAL_BYTE_CEILING,
  Y_BANDS,
} from './mural-vocabulary.js';
import { formatSvgNumber } from '../rendering/format-svg-number.js';
import { renderMuralSvg } from './render-mural-svg.js';
import { mountain } from './worlds/mountain.js';

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function scene(snapshot: HistorySnapshot) {
  return buildMuralScene(snapshot, narrate(snapshot), scoreStrengths(snapshot));
}

function byteLength(svg: string): number {
  return Buffer.byteLength(svg, 'utf8');
}

/** The cairn capstone circle — a geometry fingerprint no other camp silhouette draws. */
const CAIRN_CAPSTONE = 'cy="-0.87" r="0.13"';
const WATER_BAND = `y="${formatSvgNumber(Y_BANDS.roadBaseline - 10)}"`;

describe('mountain world render', () => {
  it('renders byte-different from desert and from river for a dense fixture', () => {
    const snapshot = loadHistorySnapshotFixture('fifteen-year-overflow.json');
    expect(renderMural(snapshot, 'mountain')).not.toBe(renderMural(snapshot, 'desert'));
    expect(renderMural(snapshot, 'mountain')).not.toBe(renderMural(snapshot, 'river'));
  });

  it('draws a recolored road spine — no water band, no flow loop', () => {
    const snapshot = loadHistorySnapshotFixture('rich-history-account.json');
    const svg = renderMural(snapshot, 'mountain');
    expect(svg).toContain(`stroke="${mountain.spine.color}"`);
    expect(svg).not.toContain(WATER_BAND);
    expect(svg).not.toContain('stroke-dashoffset');
  });

  it('holds the grace floor: a single-commit account renders complete with the cairn camp drawn', () => {
    const snapshot = loadHistorySnapshotFixture('single-contribution-account.json');
    const svg = renderMural(snapshot, 'mountain');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
    expect(svg).toContain(CAIRN_CAPSTONE);
    expect(renderMural(snapshot, 'desert')).not.toContain(CAIRN_CAPSTONE);
    expectEmbedSafeSvg(svg);
  });

  it('stays embed-safe for a dense mountain strip', () => {
    expectEmbedSafeSvg(renderMural(loadHistorySnapshotFixture('fifteen-year-overflow.json'), 'mountain'));
  });

  it('re-renders a dense fixture byte-identically', () => {
    const snapshot = loadHistorySnapshotFixture('fifteen-year-overflow.json');
    expect(renderMural(snapshot, 'mountain')).toBe(renderMural(snapshot, 'mountain'));
  });

  it('keeps the worst-case mountain render inside both byte ceilings', () => {
    const snapshot = loadHistorySnapshotFixture('fifteen-year-overflow.json');
    expect(byteLength(renderMural(snapshot, 'mountain'))).toBeLessThan(MURAL_ANIMATED_BYTE_CEILING);
    expect(byteLength(renderMuralSvg(scene(snapshot), mountain))).toBeLessThan(MURAL_BYTE_CEILING);
  });
});
