import { describe, expect, it, vi } from 'vitest';
import { detectChapters } from '../chapters/detect-chapters.js';
import { narrateChapter } from '../narration/narrate-chapter.js';
import { scoreStrengths } from '../strengths/score-strengths.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { buildMuralScene } from './build-mural-scene.js';
import type { Chapter } from '../chapters/chapter.js';
import type { PlacedEra } from './mural-scene.js';
import { buildCameraTrack, DWELL_KEYSPLINE, ZIP_KEYSPLINE } from './build-camera.js';
import { CAMERA_WINDOW_WIDTH } from './mural-vocabulary.js';
import { MAX_DWELLED_ERAS, REPLAY_MAX_SECONDS, REPLAY_MIN_SECONDS } from './camera-track.js';

function placedEra(partial: Partial<PlacedEra> = {}): PlacedEra {
  return {
    chapter: null,
    startDate: '2020-01-01',
    endDate: '2021-01-01',
    tier: 'modern',
    x: 0,
    width: 200,
    slots: [],
    ribbon: [],
    title: '',
    motifs: [],
    ...partial,
  };
}

function boomChapter(): Chapter {
  return { kind: 'great-streak', date: '2020-01-01', endDate: '2020-06-01', lengthDays: 150 };
}

function laidOutEras(chapters: (Chapter | null)[], eraWidth = 300): PlacedEra[] {
  return chapters.map((chapter, index) =>
    placedEra({
      chapter,
      x: index * eraWidth,
      width: eraWidth,
      tier: chapter === null ? 'modern' : 'ancient',
    }),
  );
}

const richScene = (() => {
  const snapshot = loadHistorySnapshotFixture('rich-history-account.json');
  return buildMuralScene(
    snapshot,
    detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) })),
    scoreStrengths(snapshot),
  );
})();

describe('buildCameraTrack — rich metropolis', () => {
  it('dwells present-day plus up to the cap, zips the rest, lands inside the replay window', () => {
    const { track, eraTimings } = buildCameraTrack(richScene.eras, richScene.width);
    const dwelled = eraTimings.filter((timing) => timing.dwelled);

    expect(eraTimings).toHaveLength(richScene.eras.length);
    expect(dwelled.length).toBeLessThanOrEqual(MAX_DWELLED_ERAS);
    expect(eraTimings[eraTimings.length - 1].dwelled).toBe(true);
    expect(track.totalSeconds).toBeGreaterThanOrEqual(REPLAY_MIN_SECONDS);
    expect(track.totalSeconds).toBeLessThanOrEqual(REPLAY_MAX_SECONDS);
  });

  it('warns which eras were zipped when the dwell cap binds', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    buildCameraTrack(richScene.eras, richScene.width);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('buildCameraTrack — selection', () => {
  it('keeps the later of two equal-weight booms and zips the earlier one', () => {
    const eras = laidOutEras([
      { kind: 'origin', date: null },
      boomChapter(),
      boomChapter(),
      boomChapter(),
      boomChapter(),
      boomChapter(),
      boomChapter(),
      null,
    ]);
    const { eraTimings } = buildCameraTrack(eras, eras.length * 300);

    expect(eraTimings.filter((timing) => timing.dwelled).length).toBe(MAX_DWELLED_ERAS);
    expect(eraTimings[6].dwelled).toBe(true);
    expect(eraTimings[1].dwelled).toBe(false);
  });
});

describe('buildCameraTrack — dark-age hold', () => {
  it('dwells the dark age with a near-zero drift delta', () => {
    const eras = laidOutEras([
      { kind: 'origin', date: null },
      { kind: 'dark-age', date: '2021-01-01', endDate: '2022-06-01', lengthDays: 500 },
      null,
    ]);
    const { track, eraTimings } = buildCameraTrack(eras, eras.length * 300);

    const darkAgeIndex = 1;
    expect(eraTimings).toHaveLength(eras.length);
    expect(eraTimings[darkAgeIndex].dwelled).toBe(true);

    const dwellStart = eraTimings[darkAgeIndex].dwellStartSeconds;
    const stopAt = track.keyTimes.findIndex(
      (keyTime) => Math.abs(keyTime * track.totalSeconds - dwellStart) < 1e-6,
    );
    expect(stopAt).toBeGreaterThanOrEqual(0);
    expect(Math.abs(track.values[stopAt] - track.values[stopAt + 1])).toBeLessThan(0.5);
  });
});

describe('buildCameraTrack — sub-window grace floor', () => {
  it('holds a single centered stop with no pan', () => {
    const sceneWidth = CAMERA_WINDOW_WIDTH - 200;
    const eras = laidOutEras([null], sceneWidth);
    const { track, eraTimings } = buildCameraTrack(eras, sceneWidth);

    expect(track.values).toHaveLength(1);
    expect(track.values[0]).toBeCloseTo((CAMERA_WINDOW_WIDTH - sceneWidth) / 2, 6);
    expect(eraTimings[0].dwelled).toBe(true);
  });
});

describe('buildCameraTrack — low count', () => {
  it('allows a replay shorter than the minimum when two or fewer eras dwell', () => {
    const eras = laidOutEras([{ kind: 'origin', date: null }, null], 900);
    const { track, eraTimings } = buildCameraTrack(eras, 1800);

    expect(eraTimings.filter((timing) => timing.dwelled).length).toBeLessThanOrEqual(2);
    expect(track.totalSeconds).toBeLessThan(REPLAY_MIN_SECONDS);
  });
});

describe('buildCameraTrack — track well-formedness', () => {
  it('emits monotonic keyTimes in [0,1] with length-consistent arrays', () => {
    const { track } = buildCameraTrack(richScene.eras, richScene.width);

    expect(track.keyTimes[0]).toBe(0);
    expect(track.keyTimes[track.keyTimes.length - 1]).toBe(1);
    expect(track.values).toHaveLength(track.keyTimes.length);
    expect(track.keySplines).toHaveLength(track.keyTimes.length - 1);
    for (let index = 1; index < track.keyTimes.length; index++) {
      expect(track.keyTimes[index]).toBeGreaterThan(track.keyTimes[index - 1]);
    }
    track.keyTimes.forEach((keyTime) => {
      expect(keyTime).toBeGreaterThanOrEqual(0);
      expect(keyTime).toBeLessThanOrEqual(1);
    });
  });

  it('ends on the present-day dwell with no trailing zip', () => {
    const { track } = buildCameraTrack(richScene.eras, richScene.width);
    const lastSpline = track.keySplines[track.keySplines.length - 1];
    expect(lastSpline).toBe(DWELL_KEYSPLINE);
    expect(track.keySplines).toContain(ZIP_KEYSPLINE);
  });
});

describe('buildCameraTrack — determinism', () => {
  it('re-renders byte-identical timings', () => {
    expect(buildCameraTrack(richScene.eras, richScene.width)).toEqual(
      buildCameraTrack(richScene.eras, richScene.width),
    );
  });
});
