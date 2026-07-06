import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { detectChapters } from '../chapters/detect-chapters.js';
import type { HttpResponse, HttpTransport } from '../github/http-transport.js';
import { narrateChapter } from '../narration/narrate-chapter.js';
import { renderMural } from '../render-mural.js';
import { formatSvgNumber } from '../rendering/format-svg-number.js';
import { createInMemoryEpicCache } from '../service/in-memory-epic-cache.js';
import { handleImageRequest } from '../service/handle-image-request.js';
import { scoreStrengths } from '../strengths/score-strengths.js';
import type { Chapter } from '../chapters/chapter.js';
import type { HistorySnapshot } from '../history-snapshot.js';
import type { NarratedChapter } from '../timeline/build-timeline.js';
import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { expectEmbedSafeSvg } from '../test-support/expect-embed-safe-svg.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { buildCameraTrack, DWELL_KEYSPLINE, ZIP_KEYSPLINE } from './build-camera.js';
import { buildMuralScene } from './build-mural-scene.js';
import { REPLAY_MAX_SECONDS, REPLAY_MIN_SECONDS } from './camera-track.js';
import type { PlacedEra } from './mural-scene.js';
import {
  CAMERA_WINDOW_WIDTH,
  MURAL_ANIMATED_BYTE_CEILING,
  MURAL_BYTE_CEILING,
  Y_BANDS,
} from './mural-vocabulary.js';
import { renderMuralSvg } from './render-mural-svg.js';
import { WORLD_NAMES, worlds } from './worlds/catalog.js';
import { resolveWorldName } from './worlds/resolve-world-name.js';

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function scene(snapshot: HistorySnapshot) {
  return buildMuralScene(snapshot, narrate(snapshot), scoreStrengths(snapshot));
}

function mural(fixtureFileName: string): string {
  return renderMural(loadHistorySnapshotFixture(fixtureFileName));
}

function byteLength(svg: string): number {
  return Buffer.byteLength(svg, 'utf8');
}

/** The single panning `animateTransform` — the only spline-timed transform in the render. */
function panAnimateTransform(svg: string): string {
  const match = svg.match(/<animateTransform[^>]*calcMode="spline"[^>]*\/>/);
  expect(match).not.toBeNull();
  return match![0];
}

function placedEra(partial: Partial<PlacedEra> = {}): PlacedEra {
  return {
    chapter: null,
    startDate: '2020-01-01',
    endDate: '2021-01-01',
    tier: 'modern',
    x: 0,
    width: 500,
    slots: [],
    ribbon: [],
    title: '',
    motifs: [],
    ...partial,
  };
}

const boomChapter: Chapter = {
  kind: 'great-streak',
  date: '2020-01-01',
  endDate: '2020-06-01',
  lengthDays: 150,
};

describe('dwell-and-zip done-when suite', () => {
  describe('plays once, freezes, then rests', () => {
    const svg = mural('rich-history-account.json');

    it('freezes the pan with no repeat', () => {
      const pan = panAnimateTransform(svg);
      expect(pan).toContain('fill="freeze"');
      expect(pan).not.toContain('repeatCount');
    });

    it('loops the ambient rest state forever', () => {
      expect(svg).toContain('repeatCount="indefinite"');
    });

    it('ends the pan on the present-day center at the right edge', () => {
      const s = scene(loadHistorySnapshotFixture('rich-history-account.json'));
      const { track, eraTimings } = buildCameraTrack(s.eras, s.width);
      expect(eraTimings[eraTimings.length - 1].dwelled).toBe(true);
      expect(track.values[track.values.length - 1]).toBe(CAMERA_WINDOW_WIDTH - s.width);
      expect(track.keySplines[track.keySplines.length - 1]).toBe(DWELL_KEYSPLINE);
    });
  });

  describe('bounded file and replay window', () => {
    it('keeps the dense animated render under the animated ceiling', () => {
      expect(MURAL_ANIMATED_BYTE_CEILING).toBeGreaterThan(MURAL_BYTE_CEILING);
      expect(byteLength(mural('rich-history-account.json'))).toBeLessThan(MURAL_ANIMATED_BYTE_CEILING);
      expect(byteLength(mural('fifteen-year-overflow.json'))).toBeLessThan(MURAL_ANIMATED_BYTE_CEILING);
    });

    it('lands multi-era replays inside the 12–18s window', () => {
      for (const fixture of ['rich-history-account.json', 'fifteen-year-overflow.json']) {
        const s = scene(loadHistorySnapshotFixture(fixture));
        const { track } = buildCameraTrack(s.eras, s.width);
        expect(track.totalSeconds).toBeGreaterThanOrEqual(REPLAY_MIN_SECONDS);
        expect(track.totalSeconds).toBeLessThanOrEqual(REPLAY_MAX_SECONDS);
      }
    });

    it('lets a two-dwell history dip below the replay floor rather than pad a near-static hold', () => {
      const eras = [
        placedEra({ chapter: boomChapter, tier: 'ancient', x: 0, width: 500 }),
        placedEra({ chapter: null, tier: 'modern', x: 500, width: 500 }),
      ];
      const { track, eraTimings } = buildCameraTrack(eras, 1000);
      expect(eraTimings.filter((timing) => timing.dwelled)).toHaveLength(2);
      expect(track.totalSeconds).toBeLessThan(REPLAY_MIN_SECONDS);
    });
  });

  describe('dwell readable, zip smooth', () => {
    const s = scene(loadHistorySnapshotFixture('rich-history-account.json'));
    const { track } = buildCameraTrack(s.eras, s.width);

    it('drifts near-linearly on dwells and eases in-out on zips', () => {
      expect(track.keySplines).toContain(DWELL_KEYSPLINE);
      expect(track.keySplines).toContain(ZIP_KEYSPLINE);
    });

    it('fires an opacity beat on the dwelled eras', () => {
      const svg = mural('rich-history-account.json');
      expect(svg).toContain('attributeName="opacity" from="0" to="1"');
    });
  });

  describe('grace floor', () => {
    const subWindow = buildHistorySnapshot({
      handle: 'unwritten-legend',
      firstPublicActivityDate: null,
      accountCreatedDate: '2026-06-30',
      capturedAtDate: '2026-07-04',
    });

    it('holds a complete centered still with no pan for a sub-window account', () => {
      const svg = renderMural(subWindow);
      const centered = (CAMERA_WINDOW_WIDTH - scene(subWindow).width) / 2;
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
      expect(svg).toContain(`transform="translate(${centered},0)"`);
      expect(svg).not.toContain('calcMode="spline"');
      expectEmbedSafeSvg(svg);
    });

    it('renders single-commit and brand-new accounts without crashing', () => {
      for (const fixture of ['single-contribution-account.json', 'brand-new-account.json']) {
        const svg = mural(fixture);
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg).not.toContain('calcMode="spline"');
        expectEmbedSafeSvg(svg);
      }
    });
  });

  describe('embed-safe and deterministic', () => {
    it('stays embed-safe with an XML-hostile handle', () => {
      const hostile = buildHistorySnapshot({ handle: '<script>&"\'/' });
      expectEmbedSafeSvg(renderMural(hostile));
    });

    it('re-renders a dense fixture byte-identically', () => {
      expect(mural('fifteen-year-overflow.json')).toBe(mural('fifteen-year-overflow.json'));
    });

    it('builds the same camera track on re-run', () => {
      const s = scene(loadHistorySnapshotFixture('rich-history-account.json'));
      expect(buildCameraTrack(s.eras, s.width)).toEqual(buildCameraTrack(s.eras, s.width));
    });
  });

  describe('static path is untouched', () => {
    it('leaves the static mural byte-identical and motion-free', () => {
      const staticGolden = readFileSync(
        fileURLToPath(new URL('../../examples/stage-1-phase-8/rich-history-account.svg', import.meta.url)),
        'utf8',
      );
      const s = scene(loadHistorySnapshotFixture('rich-history-account.json'));
      const staticSvg = renderMuralSvg(s);
      expect(staticSvg).toBe(staticGolden);
      expect(staticSvg).not.toContain('<animate');
    });
  });
});

const WATER_BAND = `y="${formatSvgNumber(Y_BANDS.roadBaseline - 10)}"`;
/** The cairn capstone circle — a geometry fingerprint only mountain's camp silhouette draws. */
const CAIRN_CAPSTONE = 'cy="-0.87" r="0.13"';
const ANY_HANDLE_FIXTURES = [
  'brand-new-account.json',
  'single-contribution-account.json',
  'rich-history-account.json',
];
const GRACE_FIXTURES = ['single-contribution-account.json', 'brand-new-account.json'];
const DENSE_FIXTURE = 'fifteen-year-overflow.json';

function isComplete(svg: string): boolean {
  return svg.startsWith('<svg') && svg.trimEnd().endsWith('</svg>');
}

describe('stage-4 three-world done-when suite', () => {
  describe.each([...WORLD_NAMES])('the %s world', (world) => {
    it('renders a complete animated epic for any handle', () => {
      for (const fixture of ANY_HANDLE_FIXTURES) {
        const svg = renderMural(loadHistorySnapshotFixture(fixture), world);
        expect(isComplete(svg)).toBe(true);
        expectEmbedSafeSvg(svg);
      }
    });

    it('stays deterministic on a re-rendered dense fixture', () => {
      const snapshot = loadHistorySnapshotFixture(DENSE_FIXTURE);
      expect(renderMural(snapshot, world)).toBe(renderMural(snapshot, world));
    });

    it('keeps the dense worst case inside both byte ceilings', () => {
      const snapshot = loadHistorySnapshotFixture(DENSE_FIXTURE);
      expect(byteLength(renderMural(snapshot, world))).toBeLessThan(MURAL_ANIMATED_BYTE_CEILING);
      expect(byteLength(renderMuralSvg(scene(snapshot), worlds[world]))).toBeLessThan(MURAL_BYTE_CEILING);
    });

    it('holds the grace floor for single-commit and brand-new accounts', () => {
      for (const fixture of GRACE_FIXTURES) {
        const svg = renderMural(loadHistorySnapshotFixture(fixture), world);
        expect(isComplete(svg)).toBe(true);
        expect(svg).not.toContain('calcMode="spline"');
        expectEmbedSafeSvg(svg);
      }
    });
  });

  it('renders the three worlds byte-distinct for a dense fixture', () => {
    const snapshot = loadHistorySnapshotFixture(DENSE_FIXTURE);
    const renders = WORLD_NAMES.map((world) => renderMural(snapshot, world));
    expect(new Set(renders).size).toBe(WORLD_NAMES.length);
  });

  it('draws the river water spine and the mountain cairn at the grace floor, desert neither', () => {
    const snapshot = loadHistorySnapshotFixture('single-contribution-account.json');
    const riverSvg = renderMural(snapshot, 'river');
    const mountainSvg = renderMural(snapshot, 'mountain');
    const desertSvg = renderMural(snapshot, 'desert');
    expect(riverSvg).toContain(WATER_BAND);
    expect(mountainSvg).toContain(CAIRN_CAPSTONE);
    expect(desertSvg).not.toContain(WATER_BAND);
    expect(desertSvg).not.toContain(CAIRN_CAPSTONE);
  });

  describe('the world parameter through the service', () => {
    const NOW_ISO = '2026-07-05T12:00:00.000Z';
    const profile = { login: 'octocat', type: 'User', created_at: '2011-01-25T18:44:36Z' };
    const repos = [
      {
        name: 'hello-world',
        created_at: '2012-02-01T00:00:00Z',
        pushed_at: '2019-04-01T00:00:00Z',
        stargazers_count: 80,
        language: 'TypeScript',
      },
    ];
    const contributionsHtml = '<td data-date="2011-03-04" data-count="5"></td>';

    function successTransport(): HttpTransport {
      const responses: HttpResponse[] = [
        { status: 200, headers: new Map(), body: JSON.stringify(profile) },
        { status: 200, headers: new Map(), body: JSON.stringify(repos) },
        { status: 200, headers: new Map(), body: contributionsHtml },
      ];
      return {
        async get() {
          const response = responses.shift();
          if (!response) throw new Error('unexpected request');
          return response;
        },
      };
    }

    it('picks the requested world and keys its own cache entry', async () => {
      const cache = createInMemoryEpicCache();
      const river = await handleImageRequest(
        'octocat',
        { transport: successTransport(), cache, nowIso: NOW_ISO },
        'mural',
        'river',
      );
      const mountain = await handleImageRequest(
        'octocat',
        { transport: successTransport(), cache, nowIso: NOW_ISO },
        'mural',
        'mountain',
      );
      expect(river.body).not.toBe(mountain.body);
      expect((await cache.get('octocat:mural:river'))?.document).toBe(river.body);
      expect((await cache.get('octocat:mural:mountain'))?.document).toBe(mountain.body);
    });

    it('hash-defaults an absent or invalid world to the same deterministic world', async () => {
      const fallback = resolveWorldName(null, 'octocat');
      for (const requested of [null, 'ocean', 'River']) {
        const cache = createInMemoryEpicCache();
        const response = await handleImageRequest(
          'octocat',
          { transport: successTransport(), cache, nowIso: NOW_ISO },
          'mural',
          requested,
        );
        expect((await cache.get(`octocat:mural:${fallback}`))?.document).toBe(response.body);
      }
    });
  });
});
