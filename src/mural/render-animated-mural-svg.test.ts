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
import { BEAT_SETTLE_SECONDS, PLANE_RATE } from './camera-track.js';
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

/** Every `<g class="mural-era">...</g>` inside the front plane, in scene-era order. */
function eraGroups(svg: string): string[] {
  const front = frontPlane(svg);
  const marker = '<g class="mural-era"';
  const groups: string[] = [];
  let cursor = 0;
  while (true) {
    const open = front.indexOf(marker, cursor);
    if (open < 0) return groups;
    let depth = 0;
    for (let index = open; index < front.length; index++) {
      if (front.startsWith('<g', index)) depth++;
      else if (front.startsWith('</g>', index)) {
        depth--;
        if (depth === 0) {
          groups.push(front.slice(open, index + 4));
          cursor = index + 4;
          break;
        }
      }
    }
  }
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
    const animate = front.slice(front.lastIndexOf('<animateTransform'));

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

describe('renderAnimatedMuralSvg per-era intro beats', () => {
  it('wraps every era in a front-plane era group, one per scene era', () => {
    const groups = eraGroups(renderAnimatedMuralSvg(richScene));
    expect(groups).toHaveLength(richScene.eras.length);
  });

  it('rises and fades a dwelled era in from its settled dwell start', () => {
    const { eraTimings } = buildCameraTrack(richScene.eras, richScene.width);
    const dwelledIndex = eraTimings.findIndex((timing) => timing.dwelled);
    const group = eraGroups(renderAnimatedMuralSvg(richScene))[dwelledIndex];
    const begin = `${formatSvgNumber(eraTimings[dwelledIndex].dwellStartSeconds + BEAT_SETTLE_SECONDS)}s`;

    const opacity = group.slice(group.indexOf('<animate '));
    expect(attribute(opacity, 'attributeName')).toBe('opacity');
    expect(attribute(opacity, 'from')).toBe('0');
    expect(attribute(opacity, 'to')).toBe('1');
    expect(attribute(opacity, 'begin')).toBe(begin);
    expect(opacity).toContain('fill="freeze"');

    const rise = group.slice(group.indexOf('<animateTransform'));
    expect(attribute(rise, 'type')).toBe('translate');
    expect(attribute(rise, 'from')).toBe('0 8');
    expect(attribute(rise, 'to')).toBe('0 0');
    expect(attribute(rise, 'begin')).toBe(begin);
    expect(group).toContain('opacity="0"');
  });

  it('leaves a zipped era present with no beat', () => {
    const { eraTimings } = buildCameraTrack(richScene.eras, richScene.width);
    const zippedIndex = eraTimings.findIndex((timing) => !timing.dwelled);
    expect(zippedIndex).toBeGreaterThanOrEqual(0);
    const group = eraGroups(renderAnimatedMuralSvg(richScene))[zippedIndex];
    expect(group).not.toContain('<animate');
    expect(group).not.toContain('opacity="0"');
  });

  it('emits two beats per dwelled era, capped by the dwell budget', () => {
    const { eraTimings } = buildCameraTrack(richScene.eras, richScene.width);
    const dwelledCount = eraTimings.filter((timing) => timing.dwelled).length;
    const groups = eraGroups(renderAnimatedMuralSvg(richScene)).join('');
    const opacityBeats = groups.match(/<animate /g) ?? [];
    const riseBeats = groups.match(/<animateTransform/g) ?? [];
    expect(opacityBeats).toHaveLength(dwelledCount);
    expect(opacityBeats.length + riseBeats.length).toBe(dwelledCount * 2);
    expect(opacityBeats.length + riseBeats.length).toBeLessThanOrEqual(12);
  });

  it('nests the era beat groups inside the panning front plane', () => {
    const svg = renderAnimatedMuralSvg(richScene);
    const front = frontPlane(svg);
    expect(front).toContain('<g class="mural-era"');
    expect(front.indexOf('<g class="mural-plane front"')).toBe(0);
  });
});

describe('renderAnimatedMuralSvg sub-window grace floor', () => {
  it('holds every era still with no beat', () => {
    const groups = eraGroups(renderAnimatedMuralSvg(subWindowScene));
    expect(groups).toHaveLength(subWindowScene.eras.length);
    for (const group of groups) {
      expect(group).not.toContain('<animate');
      expect(group).not.toContain('opacity="0"');
    }
  });

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
