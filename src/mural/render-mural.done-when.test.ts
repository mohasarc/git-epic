import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { detectChapters } from '../chapters/detect-chapters.js';
import { narrateChapter } from '../narration/narrate-chapter.js';
import { renderEpic } from '../render-epic.js';
import { renderMural } from '../render-mural.js';
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
} from './mural-vocabulary.js';
import { renderMuralSvg } from './render-mural-svg.js';

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
    it('leaves the cosmic embed byte-identical to its golden', () => {
      const cosmicGolden = readFileSync(
        fileURLToPath(new URL('../../examples/stage-3-phase-5/rich-history-account.svg', import.meta.url)),
        'utf8',
      );
      expect(renderEpic(loadHistorySnapshotFixture('rich-history-account.json'))).toBe(cosmicGolden);
    });

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
