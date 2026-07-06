import { describe, expect, it } from 'vitest';
import {
  BEAT_SETTLE_SECONDS,
  MAX_DWELLED_ERAS,
  MIN_DWELL_SECONDS,
  PLANE_RATE,
  REPLAY_MAX_SECONDS,
  REPLAY_MIN_SECONDS,
  TOTAL_REPLAY_SECONDS,
  ZIP_SECONDS,
  type CameraTrack,
} from './camera-track.js';

describe('camera track timing constants', () => {
  it('targets a replay length inside its min/max bounds', () => {
    expect(REPLAY_MIN_SECONDS).toBeLessThan(REPLAY_MAX_SECONDS);
    expect(TOTAL_REPLAY_SECONDS).toBeGreaterThanOrEqual(REPLAY_MIN_SECONDS);
    expect(TOTAL_REPLAY_SECONDS).toBeLessThanOrEqual(REPLAY_MAX_SECONDS);
  });

  it('keeps each dwell longer than the zip and the beat settle', () => {
    expect(MIN_DWELL_SECONDS).toBeGreaterThan(0);
    expect(ZIP_SECONDS).toBeGreaterThan(0);
    expect(ZIP_SECONDS).toBeLessThan(MIN_DWELL_SECONDS);
    expect(BEAT_SETTLE_SECONDS).toBeGreaterThan(0);
    expect(BEAT_SETTLE_SECONDS).toBeLessThan(MIN_DWELL_SECONDS);
  });

  it('caps the dwelled-era count below the maximum era count', () => {
    expect(MAX_DWELLED_ERAS).toBeGreaterThan(0);
    expect(Number.isInteger(MAX_DWELLED_ERAS)).toBe(true);
    expect(MAX_DWELLED_ERAS).toBeLessThanOrEqual(9);
  });

  it('pins the sky flat, the front at full rate, the distant band between', () => {
    expect(PLANE_RATE.sky).toBe(0);
    expect(PLANE_RATE.front).toBe(1);
    expect(PLANE_RATE.distantBand).toBeGreaterThan(PLANE_RATE.sky);
    expect(PLANE_RATE.distantBand).toBeLessThan(PLANE_RATE.front);
  });
});

describe('camera track shape', () => {
  it('constructs a well-formed track with index-aligned era timings', () => {
    const track: CameraTrack = {
      track: { keyTimes: [0, 1], keySplines: ['0.4 0 0.2 1'], values: [0, -100], totalSeconds: 15 },
      eraTimings: [
        { dwelled: true, dwellStartSeconds: 0 },
        { dwelled: false, dwellStartSeconds: 0 },
      ],
    };
    expect(track.track.keyTimes.length).toBe(track.track.values.length);
    expect(track.track.keySplines.length).toBe(track.track.keyTimes.length - 1);
    expect(track.eraTimings).toHaveLength(2);
  });
});
