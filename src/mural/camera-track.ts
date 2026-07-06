/**
 * The dwell-and-zip camera model (§Stage-3): types and shared timing constants for the baked
 * SMIL pan. `buildCameraTrack` (Phase 3) produces a `CameraTrack`; the animated renderer stamps
 * its `values`/`keyTimes`/`keySplines` into `animateTransform`s. All constants are impl-time
 * calibration defaults, not architecture — tuned against real renders.
 */

/** Foreground translateX stops plus the timing that drives every plane's `animateTransform`. */
export type CameraTrack = {
  track: {
    keyTimes: number[];
    keySplines: string[];
    values: number[];
    totalSeconds: number;
  };
  /** Index-aligned to the scene's eras: whether each dwelled, and when its dwell begins. */
  eraTimings: { dwelled: boolean; dwellStartSeconds: number }[];
};

/** Target total replay length, normalized to land inside the min/max window. */
export const TOTAL_REPLAY_SECONDS = 15;
export const REPLAY_MIN_SECONDS = 12;
export const REPLAY_MAX_SECONDS = 18;

/** Floor on a single era's dwell so it reads before the camera zips on. */
export const MIN_DWELL_SECONDS = 1.4;

/** Most eras that carry a dwell + intro beat; the rest zip through unbeaten. */
export const MAX_DWELLED_ERAS = 6;

/** A fast eased whip between dwelled stops — never a cut. */
export const ZIP_SECONDS = 0.6;

/** Delay after a dwell begins before its intro beat fires. */
export const BEAT_SETTLE_SECONDS = 0.15;

/** Parallax rate per depth plane: sky pinned, front full, distant band between. */
export const PLANE_RATE = { sky: 0, distantBand: 0.4, front: 1 } as const;
