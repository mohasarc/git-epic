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
import type { MuralMotif, MuralScene } from './mural-scene.js';
import { buildCameraTrack } from './build-camera.js';
import { BEAT_SETTLE_SECONDS, PLANE_RATE } from './camera-track.js';
import { renderSubtitle } from './layers/text.js';
import { CAMERA_WINDOW_WIDTH, MURAL_HEIGHT, Y_BANDS } from './mural-vocabulary.js';
import { renderAnimatedMuralSvg } from './render-animated-mural-svg.js';
import { renderMuralSvg } from './render-mural-svg.js';

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

/** The topmost `<g class="mural-hud">...</g>` overlay, balanced by group depth. */
function hudGroup(svg: string): string {
  const open = svg.indexOf('<g class="mural-hud"');
  expect(open).toBeGreaterThanOrEqual(0);
  let depth = 0;
  for (let index = open; index < svg.length; index++) {
    if (svg.startsWith('<g', index)) depth++;
    else if (svg.startsWith('</g>', index)) {
      depth--;
      if (depth === 0) return svg.slice(open, index + 4);
    }
  }
  throw new Error('unbalanced hud group');
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

/** Every balanced `<g class="<className>">...</g>` group, in document order. */
function groupsByClass(svg: string, className: string): string[] {
  const marker = `<g class="${className}"`;
  const groups: string[] = [];
  let cursor = 0;
  while (true) {
    const open = svg.indexOf(marker, cursor);
    if (open < 0) return groups;
    let depth = 0;
    for (let index = open; index < svg.length; index++) {
      if (svg.startsWith('<g', index)) depth++;
      else if (svg.startsWith('</g>', index)) {
        depth--;
        if (depth === 0) {
          groups.push(svg.slice(open, index + 4));
          cursor = index + 4;
          break;
        }
      }
    }
  }
}

/** One motif, seated at an absolute x (rest window of the rich strip starts at 1317). */
function motifAt(kind: MuralMotif['kind'], x: number, overrides: Partial<MuralMotif> = {}): MuralMotif {
  return {
    dimension: 'stars',
    kind,
    tier: 2,
    x,
    width: 100,
    baselineY: Y_BANDS.roadBaseline,
    count: 1,
    standout: false,
    ...overrides,
  };
}

/**
 * Rich strip with every era's motifs cleared, then the given rest-window motifs seated on the
 * trailing present-day era and the off-window motifs on the first era. Lets a test own exactly
 * what falls in the rest window.
 */
function withMotifs(base: MuralScene, restWindow: MuralMotif[], offWindow: MuralMotif[] = []): MuralScene {
  const last = base.eras.length - 1;
  return {
    ...base,
    eras: base.eras.map((era, index) => {
      if (index === last) return { ...era, motifs: restWindow };
      if (index === 0) return { ...era, motifs: offWindow };
      return { ...era, motifs: [] };
    }),
  };
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
    const opacityBeats = groups.match(/<animate attributeName="opacity" from="0"/g) ?? [];
    const riseBeats = groups.match(/<animateTransform attributeName="transform" type="translate" from="0 8"/g) ?? [];
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

describe('renderAnimatedMuralSvg HUD overlay', () => {
  it('places the HUD last in document order with no translate', () => {
    const svg = renderAnimatedMuralSvg(richScene);
    const hud = hudGroup(svg);
    expect(svg.indexOf('<g class="mural-hud"')).toBeGreaterThan(
      svg.indexOf('<g class="mural-plane front"'),
    );
    expect(svg.endsWith(`${hud}</svg>`)).toBe(true);
    expect(hud).not.toContain('<animateTransform');
    expect(hud).not.toContain('transform=');
  });

  it('pins the subtitle at full opacity', () => {
    const hud = hudGroup(renderAnimatedMuralSvg(richScene));
    expect(hud).toContain(renderSubtitle(richScene));
  });

  it('anchors the finale to the camera window, inside the frame', () => {
    const hud = hudGroup(renderAnimatedMuralSvg(richScene));
    const rect = hud.match(/<rect x="([-\d.]+)" y="[-\d.]+" width="([\d.]+)"/);
    expect(rect).not.toBeNull();
    const left = Number(rect![1]);
    const width = Number(rect![2]);
    expect(left).toBeGreaterThanOrEqual(16);
    expect(left + width).toBeLessThanOrEqual(CAMERA_WINDOW_WIDTH);
    expect(richScene.width).toBeGreaterThan(CAMERA_WINDOW_WIDTH);
    expect(left + width).toBeLessThan(richScene.width);
  });

  it('keeps the finale panel in the sky band, clear of structures', () => {
    const hud = hudGroup(renderAnimatedMuralSvg(richScene));
    const rect = hud.match(/<rect x="[-\d.]+" y="([-\d.]+)" width="[\d.]+" height="([\d.]+)"/);
    const top = Number(rect![1]);
    const height = Number(rect![2]);
    expect(top).toBe(84);
    expect(top + height).toBeLessThanOrEqual(Y_BANDS.skyBottom);
  });

  it('gates the finale fade on the present-day dwell settling', () => {
    const { eraTimings } = buildCameraTrack(richScene.eras, richScene.width);
    const presentDay = eraTimings[eraTimings.length - 1];
    expect(presentDay.dwelled).toBe(true);
    const hud = hudGroup(renderAnimatedMuralSvg(richScene));
    expect(hud).toContain('<g class="mural-finale" opacity="0">');

    const fade = hud.slice(hud.indexOf('<animate '));
    expect(attribute(fade, 'attributeName')).toBe('opacity');
    expect(attribute(fade, 'from')).toBe('0');
    expect(attribute(fade, 'to')).toBe('1');
    expect(attribute(fade, 'begin')).toBe(
      `${formatSvgNumber(presentDay.dwellStartSeconds + BEAT_SETTLE_SECONDS)}s`,
    );
    expect(fade).toContain('fill="freeze"');
  });
});

describe('renderAnimatedMuralSvg rest-window ambient loops', () => {
  it('sways an in-window banner and leaves off-window motifs still', () => {
    const ambient = groupsByClass(renderAnimatedMuralSvg(richScene), 'mural-ambient');
    expect(ambient).toHaveLength(1);
    const loop = ambient[0].slice(ambient[0].indexOf('<animateTransform'));
    expect(attribute(loop, 'type')).toBe('rotate');
    expect(loop).toContain('repeatCount="indefinite"');
  });

  it('glows an in-window gold standout, off-window standouts stay still', () => {
    const scene = withMotifs(
      richScene,
      [motifAt('crownGate', 1400, { standout: true })],
      [motifAt('crownGate', 50, { standout: true })],
    );
    const ambient = groupsByClass(renderAnimatedMuralSvg(scene), 'mural-ambient');
    expect(ambient).toHaveLength(1);
    const glow = ambient[0].slice(ambient[0].indexOf('<animate '));
    expect(attribute(glow, 'attributeName')).toBe('opacity');
    expect(glow).toContain('repeatCount="indefinite"');
    expect(glow).not.toContain('<animateTransform');
  });

  it('bobs an in-window crowd', () => {
    const scene = withMotifs(richScene, [motifAt('crowd', 1400)]);
    const ambient = groupsByClass(renderAnimatedMuralSvg(scene), 'mural-ambient');
    expect(ambient).toHaveLength(1);
    const bob = ambient[0].slice(ambient[0].indexOf('<animateTransform'));
    expect(attribute(bob, 'type')).toBe('translate');
    expect(bob).toContain('repeatCount="indefinite"');
  });

  it('caps ambient-animated elements at eight', () => {
    const many = Array.from({ length: 12 }, (_unused, index) =>
      motifAt('crowd', 1330 + index * 8, { width: 20 }),
    );
    const ambient = groupsByClass(renderAnimatedMuralSvg(withMotifs(richScene, many)), 'mural-ambient');
    expect(ambient.length).toBeLessThanOrEqual(8);
    expect(ambient).toHaveLength(8);
  });

  it('keeps ambient on the inner motif, beat on the era group', () => {
    const scene = withMotifs(richScene, [motifAt('crowd', 1400)]);
    const tail = eraGroups(renderAnimatedMuralSvg(scene)).at(-1)!;
    expect(tail).toContain('<g class="mural-era" opacity="0"');
    expect(tail).toContain('<g class="mural-ambient">');
    expect(tail.indexOf('<g class="mural-ambient">')).toBeGreaterThan(tail.indexOf('<g class="mural-era"'));
    const ambient = groupsByClass(tail, 'mural-ambient')[0];
    expect(ambient).toContain('repeatCount="indefinite"');
  });

  it('adds no ambient when the rest window holds no motifs', () => {
    const scene = withMotifs(richScene, []);
    const svg = renderAnimatedMuralSvg(scene);
    expect(groupsByClass(svg, 'mural-ambient')).toHaveLength(0);
    expect(svg).toContain('<svg');
  });

  it('leaves the static mural motion-free for the same scene', () => {
    expect(renderMuralSvg(richScene)).not.toContain('<animate');
  });

  it('is embed-safe with ambient loops', () => {
    const scene = withMotifs(richScene, [motifAt('crownGate', 1400, { standout: true })]);
    expectEmbedSafeSvg(renderAnimatedMuralSvg(scene));
  });

  it('re-renders byte-identical with ambient loops', () => {
    const scene = withMotifs(richScene, [motifAt('crownGate', 1400, { standout: true })]);
    expect(renderAnimatedMuralSvg(scene)).toBe(renderAnimatedMuralSvg(scene));
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
