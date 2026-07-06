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
import { river } from './worlds/river.js';

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function scene(snapshot: HistorySnapshot) {
  return buildMuralScene(snapshot, narrate(snapshot), scoreStrengths(snapshot));
}

function byteLength(svg: string): number {
  return Buffer.byteLength(svg, 'utf8');
}

const WATER_BAND_TOP = formatSvgNumber(Y_BANDS.roadBaseline - 10);
const WATER_BAND = `y="${WATER_BAND_TOP}"`;

describe('river world render', () => {
  it('renders byte-different from desert for a dense fixture', () => {
    const snapshot = loadHistorySnapshotFixture('fifteen-year-overflow.json');
    expect(renderMural(snapshot, 'river')).not.toBe(renderMural(snapshot, 'desert'));
  });

  it('draws the water band at the ribbon-top baseline and loops the flow, unlike desert', () => {
    const snapshot = loadHistorySnapshotFixture('rich-history-account.json');
    const riverSvg = renderMural(snapshot, 'river');
    const desertSvg = renderMural(snapshot, 'desert');
    expect(riverSvg).toContain(WATER_BAND);
    expect(riverSvg).toContain('attributeName="stroke-dashoffset"');
    expect(desertSvg).not.toContain(WATER_BAND);
    expect(desertSvg).not.toContain('stroke-dashoffset');
  });

  it('holds the grace floor: a single-commit account keeps a complete water spine at the baseline', () => {
    const svg = renderMural(loadHistorySnapshotFixture('single-contribution-account.json'), 'river');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
    expect(svg).toContain(WATER_BAND);
    expectEmbedSafeSvg(svg);
  });

  it('stays embed-safe for a dense river strip', () => {
    expectEmbedSafeSvg(renderMural(loadHistorySnapshotFixture('fifteen-year-overflow.json'), 'river'));
  });

  it('re-renders a dense fixture byte-identically', () => {
    const snapshot = loadHistorySnapshotFixture('fifteen-year-overflow.json');
    expect(renderMural(snapshot, 'river')).toBe(renderMural(snapshot, 'river'));
  });

  it('keeps the worst-case river render inside both byte ceilings', () => {
    const snapshot = loadHistorySnapshotFixture('fifteen-year-overflow.json');
    expect(byteLength(renderMural(snapshot, 'river'))).toBeLessThan(MURAL_ANIMATED_BYTE_CEILING);
    expect(byteLength(renderMuralSvg(scene(snapshot), river))).toBeLessThan(MURAL_BYTE_CEILING);
  });
});
