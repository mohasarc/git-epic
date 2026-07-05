import { describe, expect, it } from 'vitest';
import { detectChapters } from '../chapters/detect-chapters.js';
import { narrateChapter } from '../narration/narrate-chapter.js';
import { scoreStrengths } from '../strengths/score-strengths.js';
import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { expectEmbedSafeSvg } from '../test-support/expect-embed-safe-svg.js';
import { formatSvgNumber } from '../rendering/format-svg-number.js';
import type { HistorySnapshot } from '../history-snapshot.js';
import type { NarratedChapter } from '../timeline/build-timeline.js';
import { buildMuralScene } from './build-mural-scene.js';
import type { MuralScene } from './mural-scene.js';
import { MURAL_HEIGHT, Y_BANDS } from './mural-vocabulary.js';
import { renderMuralSvg } from './render-mural-svg.js';
import { SKY_GRADIENT_ID } from './layers/sky.js';

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function scene(snapshot: HistorySnapshot): MuralScene {
  return buildMuralScene(snapshot, narrate(snapshot), scoreStrengths(snapshot));
}

const richScene = scene(loadHistorySnapshotFixture('rich-history-account.json'));
const brandNewScene = scene(
  buildHistorySnapshot({
    handle: 'unwritten-legend',
    firstPublicActivityDate: null,
    accountCreatedDate: '2026-06-30',
    capturedAtDate: '2026-07-04',
  }),
);

describe('renderMuralSvg strip frame', () => {
  it('emits one svg sized 0 0 W H from the scene', () => {
    const svg = renderMuralSvg(richScene);
    expect(svg.match(/<svg\b/g)).toHaveLength(1);
    expect(svg).toContain(
      `viewBox="0 0 ${formatSvgNumber(richScene.width)} ${formatSvgNumber(MURAL_HEIGHT)}"`,
    );
    expect(richScene.height).toBe(MURAL_HEIGHT);
  });

  it('draws exactly one gradient and it is the sky', () => {
    const svg = renderMuralSvg(richScene);
    expect(svg.match(/<linearGradient\b/g)).toHaveLength(1);
    expect(svg).not.toContain('<radialGradient');
    expect(svg).toContain(`id="${SKY_GRADIENT_ID}"`);
    expect(svg).toContain(`url(#${SKY_GRADIENT_ID})`);
  });
});

describe('renderMuralSvg continuous road', () => {
  it('draws one road spanning 0 to W at the road baseline', () => {
    const svg = renderMuralSvg(richScene);
    const polylines = svg.match(/<polyline\b/g) ?? [];
    expect(polylines).toHaveLength(1);
    const baseline = formatSvgNumber(Y_BANDS.roadBaseline);
    const width = formatSvgNumber(richScene.width);
    expect(svg).toContain(`points="0,${baseline} ${width},${baseline}"`);
  });

  it('does not split the road per era', () => {
    const svg = renderMuralSvg(richScene);
    expect(richScene.eras.length).toBeGreaterThan(1);
    expect(svg.match(/<polyline\b/g)).toHaveLength(1);
  });
});

describe('renderMuralSvg seams and local origins', () => {
  it('feathers era ground with flat fills only, no gradient outside the sky', () => {
    const svg = renderMuralSvg(richScene);
    expect(svg.match(/<linearGradient\b/g)).toHaveLength(1);
    expect(svg).not.toContain('<radialGradient');
    expect(svg).not.toContain('gradientTransform');
  });

  it('covers the ground band across the full strip, both margins included', () => {
    const svg = renderMuralSvg(richScene);
    const y = formatSvgNumber(Y_BANDS.horizonBottom);
    const pattern = new RegExp(
      `<g transform="translate\\((-?[\\d.]+),0\\)"><rect x="(-?[\\d.]+)" y="${y}" width="([\\d.]+)"`,
      'g',
    );
    const spans = [...svg.matchAll(pattern)]
      .map((m) => {
        const start = Number(m[1]) + Number(m[2]);
        return { start, end: start + Number(m[3]) };
      })
      .sort((a, b) => a.start - b.start);
    expect(spans).toHaveLength(richScene.eras.length);
    expect(spans[0].start).toBe(0);
    expect(spans[spans.length - 1].end).toBe(richScene.width);
    for (let i = 0; i + 1 < spans.length; i++) {
      expect(spans[i].end).toBeGreaterThanOrEqual(spans[i + 1].start);
    }
  });

  it('places every era ground under translate(era.x, 0), no absolute center', () => {
    const svg = renderMuralSvg(richScene);
    const groundTranslates = svg.match(/translate\((-?[\d.]+),0\)/g) ?? [];
    expect(groundTranslates).toHaveLength(richScene.eras.length);
    for (const era of richScene.eras) {
      expect(svg).toContain(`translate(${formatSvgNumber(era.x)},0)`);
    }
    expect(svg).not.toContain('CENTER_X');
  });
});

describe('renderMuralSvg embed safety', () => {
  it('is embed-safe for a rich strip', () => {
    expectEmbedSafeSvg(renderMuralSvg(richScene));
  });

  it('is embed-safe for a single-era brand-new strip', () => {
    const svg = renderMuralSvg(brandNewScene);
    expect(brandNewScene.eras).toHaveLength(1);
    expectEmbedSafeSvg(svg);
  });
});
