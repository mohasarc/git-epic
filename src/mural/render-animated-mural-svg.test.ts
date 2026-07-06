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
import { buildCameraTrack } from './build-camera.js';
import { PLANE_RATE } from './camera-track.js';
import { CAMERA_WINDOW_WIDTH, MURAL_HEIGHT } from './mural-vocabulary.js';
import { renderAnimatedMuralSvg } from './render-animated-mural-svg.js';

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function scene(snapshot: HistorySnapshot): MuralScene {
  return buildMuralScene(snapshot, narrate(snapshot), scoreStrengths(snapshot));
}

const richScene = scene(loadHistorySnapshotFixture('rich-history-account.json'));
const subWindowScene = scene(
  buildHistorySnapshot({
    handle: 'unwritten-legend',
    firstPublicActivityDate: null,
    accountCreatedDate: '2026-06-30',
    capturedAtDate: '2026-07-04',
  }),
);

function frontPlane(svg: string): string {
  return planeGroup(svg, 'front');
}

function midPlane(svg: string): string {
  return planeGroup(svg, 'mid');
}

function backPlane(svg: string): string {
  return planeGroup(svg, 'back');
}

/** The `<g class="mural-plane ...">...</g>` for one depth plane, balanced by group depth. */
function planeGroup(svg: string, plane: 'back' | 'mid' | 'front'): string {
  const open = svg.indexOf(`<g class="mural-plane ${plane}"`);
  expect(open).toBeGreaterThanOrEqual(0);
  let depth = 0;
  for (let index = open; index < svg.length; index++) {
    if (svg.startsWith('<g', index)) depth++;
    else if (svg.startsWith('</g>', index)) {
      depth--;
      if (depth === 0) return svg.slice(open, index + 4);
    }
  }
  throw new Error(`unbalanced plane group: ${plane}`);
}

function attribute(fragment: string, name: string): string {
  const match = fragment.match(new RegExp(`${name}="([^"]*)"`));
  expect(match).not.toBeNull();
  return match![1];
}

describe('renderAnimatedMuralSvg frame', () => {
  it('emits one svg sized to the camera window', () => {
    const svg = renderAnimatedMuralSvg(richScene);
    expect(svg.match(/<svg\b/g)).toHaveLength(1);
    expect(svg).toContain(
      `viewBox="0 0 ${formatSvgNumber(CAMERA_WINDOW_WIDTH)} ${formatSvgNumber(MURAL_HEIGHT)}"`,
    );
  });

  it('carries the accessible title and description', () => {
    const svg = renderAnimatedMuralSvg(richScene);
    expect(svg).toContain('<title>');
    expect(svg).toContain('<desc>');
  });
});

describe('renderAnimatedMuralSvg depth planes', () => {
  it('composes exactly three depth planes', () => {
    const svg = renderAnimatedMuralSvg(richScene);
    expect(svg.match(/<g class="mural-plane /g)).toHaveLength(3);
  });

  it('pins the sky plane with no translate', () => {
    const back = backPlane(renderAnimatedMuralSvg(richScene));
    expect(back).not.toContain('<animateTransform');
    expect(back).not.toContain('transform=');
  });

  it('pans the front plane on the raw track values', () => {
    const { track } = buildCameraTrack(richScene.eras, richScene.width);
    const front = frontPlane(renderAnimatedMuralSvg(richScene));
    const animate = front.slice(front.indexOf('<animateTransform'));

    const expectedValues = track.values.map((value) => `${formatSvgNumber(value)} 0`).join(';');
    const expectedKeyTimes = track.keyTimes.map((keyTime) => formatSvgNumber(keyTime)).join(';');
    expect(attribute(animate, 'type')).toBe('translate');
    expect(attribute(animate, 'values')).toBe(expectedValues);
    expect(attribute(animate, 'keyTimes')).toBe(expectedKeyTimes);
    expect(attribute(animate, 'keySplines')).toBe(track.keySplines.join(';'));
    expect(attribute(animate, 'dur')).toBe(`${formatSvgNumber(track.totalSeconds)}s`);
    expect(animate).toContain('fill="freeze"');
    expect(animate).not.toContain('repeatCount');
  });

  it('pans the distant band at the parallax rate', () => {
    const { track } = buildCameraTrack(richScene.eras, richScene.width);
    const mid = midPlane(renderAnimatedMuralSvg(richScene));
    const animate = mid.slice(mid.indexOf('<animateTransform'));

    const expectedValues = track.values
      .map((value) => `${formatSvgNumber(value * PLANE_RATE.distantBand)} 0`)
      .join(';');
    expect(attribute(animate, 'values')).toBe(expectedValues);
    expect(attribute(animate, 'keyTimes')).toBe(
      track.keyTimes.map((keyTime) => formatSvgNumber(keyTime)).join(';'),
    );
  });

  it('extends the distant band by the parallax bleed', () => {
    const svg = renderAnimatedMuralSvg(richScene);
    const mid = midPlane(svg);
    const maxPanSpan = richScene.width - CAMERA_WINDOW_WIDTH;
    const bleed = (1 - PLANE_RATE.distantBand) * maxPanSpan;
    const bandWidth = attribute(mid.slice(0, mid.indexOf('<animateTransform')), 'width');
    expect(bandWidth).toBe(formatSvgNumber(richScene.width + bleed));
  });
});

describe('renderAnimatedMuralSvg sub-window grace floor', () => {
  it('centers every plane statically with no pan', () => {
    expect(subWindowScene.width).toBeLessThanOrEqual(CAMERA_WINDOW_WIDTH);
    const svg = renderAnimatedMuralSvg(subWindowScene);
    expect(svg).not.toContain('<animateTransform');

    const centered = formatSvgNumber((CAMERA_WINDOW_WIDTH - subWindowScene.width) / 2);
    expect(frontPlane(svg)).toContain(`<g class="mural-plane front" transform="translate(${centered},0)">`);
    expect(midPlane(svg)).toContain(`<g class="mural-plane mid" transform="translate(${centered},0)">`);
  });
});

describe('renderAnimatedMuralSvg safety and determinism', () => {
  it('is embed-safe for a rich strip', () => {
    expectEmbedSafeSvg(renderAnimatedMuralSvg(richScene));
  });

  it('is embed-safe for a sub-window strip', () => {
    expectEmbedSafeSvg(renderAnimatedMuralSvg(subWindowScene));
  });

  it('re-renders byte-identical', () => {
    expect(renderAnimatedMuralSvg(richScene)).toBe(renderAnimatedMuralSvg(richScene));
  });
});
