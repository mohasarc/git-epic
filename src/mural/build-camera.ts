import type { Chapter } from '../chapters/chapter.js';
import type { PlacedEra } from './mural-scene.js';
import { CAMERA_WINDOW_WIDTH } from './mural-vocabulary.js';
import {
  MAX_DWELLED_ERAS,
  MIN_DWELL_SECONDS,
  REPLAY_MAX_SECONDS,
  REPLAY_MIN_SECONDS,
  TOTAL_REPLAY_SECONDS,
  ZIP_SECONDS,
  type CameraTrack,
} from './camera-track.js';

/** Near-linear crawl during a dwell; ease-in-out whip during a zip. */
export const DWELL_KEYSPLINE = '0 0 1 1';
export const ZIP_KEYSPLINE = '0.42 0 0.58 1';

/** Fraction of an era's width the camera drifts across during its dwell. */
const DWELL_DRIFT_FRACTION = 0.3;

/** Relative dwell length by era kind; present-day holds longest, the freeze frame. */
const DWELL_MULTIPLIER = { presentDay: 2, darkAge: 1.8, boom: 1.4, light: 1 } as const;

const BOOM_KINDS: ReadonlySet<Chapter['kind']> = new Set([
  'prolificacy',
  'great-streak',
  'flagship-rise',
  'star-milestone',
]);

/**
 * The pure dwell-and-zip camera model: a translateX pan over the placed eras that dwells on the
 * strongest beats (present-day always last and heaviest) and zips through the rest, normalized to
 * land inside the replay window. Deterministic — same eras and width in, same track out.
 */
export function buildCameraTrack(eras: PlacedEra[], sceneWidth: number): CameraTrack {
  if (sceneWidth <= CAMERA_WINDOW_WIDTH) return subWindowTrack(eras, sceneWidth);

  const dwelledIndices = selectDwelledEras(eras);
  reportZippedEras(eras, dwelledIndices);

  const stops = dwelledIndices.map((index) => dwellStop(eras[index], sceneWidth));
  const durations = normalizeDurations(
    dwelledIndices.map((index) => baseDwellSeconds(eras[index])),
  );
  return assembleTrack(eras, dwelledIndices, stops, durations);
}

type DwellStop = { startX: number; endX: number };

function dwellStop(era: PlacedEra, sceneWidth: number): DwellStop {
  const center = clampCameraX(era.x + era.width / 2, sceneWidth);
  const driftHalf = isDarkAge(era) ? 0 : (era.width * DWELL_DRIFT_FRACTION) / 2;
  return {
    startX: toTranslateX(clampCameraX(center - driftHalf, sceneWidth)),
    endX: toTranslateX(clampCameraX(center + driftHalf, sceneWidth)),
  };
}

function assembleTrack(
  eras: PlacedEra[],
  dwelledIndices: number[],
  stops: DwellStop[],
  dwellSeconds: number[],
): CameraTrack {
  const keyframeSeconds: number[] = [];
  const values: number[] = [];
  const keySplines: string[] = [];
  const dwellStartByIndex = new Map<number, number>();

  let cursor = 0;
  stops.forEach((stop, order) => {
    if (order > 0) {
      cursor += ZIP_SECONDS;
      keyframeSeconds.push(cursor);
      values.push(stop.startX);
      keySplines.push(ZIP_KEYSPLINE);
    } else {
      keyframeSeconds.push(cursor);
      values.push(stop.startX);
    }
    dwellStartByIndex.set(dwelledIndices[order], cursor);
    cursor += dwellSeconds[order];
    keyframeSeconds.push(cursor);
    values.push(stop.endX);
    keySplines.push(DWELL_KEYSPLINE);
  });

  const totalSeconds = cursor;
  return {
    track: {
      keyTimes: keyframeSeconds.map((seconds) => seconds / totalSeconds),
      keySplines,
      values,
      totalSeconds,
    },
    eraTimings: eras.map((_, index) => ({
      dwelled: dwellStartByIndex.has(index),
      dwellStartSeconds: dwellStartByIndex.get(index) ?? 0,
    })),
  };
}

function selectDwelledEras(eras: PlacedEra[]): number[] {
  const presentDayIndex = eras.length - 1;
  const slots = Math.min(MAX_DWELLED_ERAS, eras.length);
  const selected = new Set<number>([presentDayIndex]);

  const ranked = eras
    .map((era, index) => ({ index, weight: dwellWeight(era) }))
    .filter((candidate) => candidate.index !== presentDayIndex)
    .sort((a, b) => b.weight - a.weight || b.index - a.index);

  for (const candidate of ranked) {
    if (selected.size >= slots) break;
    selected.add(candidate.index);
  }
  return [...selected].sort((a, b) => a - b);
}

function normalizeDurations(baseDwellSecondsList: number[]): number[] {
  const zipTotal = Math.max(0, baseDwellSecondsList.length - 1) * ZIP_SECONDS;
  const rawDwellTotal = baseDwellSecondsList.reduce((sum, seconds) => sum + seconds, 0);

  const targetTotal =
    baseDwellSecondsList.length <= 2
      ? Math.min(rawDwellTotal + zipTotal, REPLAY_MAX_SECONDS)
      : TOTAL_REPLAY_SECONDS;
  const scale = (targetTotal - zipTotal) / rawDwellTotal;

  const scaled = baseDwellSecondsList.map((seconds) => Math.max(seconds * scale, MIN_DWELL_SECONDS));
  return capToWindow(scaled, zipTotal, baseDwellSecondsList.length <= 2);
}

function capToWindow(dwellSeconds: number[], zipTotal: number, allowUnderMin: boolean): number[] {
  const total = dwellSeconds.reduce((sum, seconds) => sum + seconds, 0) + zipTotal;
  if (total > REPLAY_MAX_SECONDS) {
    const factor = (REPLAY_MAX_SECONDS - zipTotal) / (total - zipTotal);
    return dwellSeconds.map((seconds) => seconds * factor);
  }
  if (!allowUnderMin && total < REPLAY_MIN_SECONDS) {
    const factor = (REPLAY_MIN_SECONDS - zipTotal) / (total - zipTotal);
    return dwellSeconds.map((seconds) => seconds * factor);
  }
  return dwellSeconds;
}

function subWindowTrack(eras: PlacedEra[], sceneWidth: number): CameraTrack {
  const dwelledIndex = eras.length - 1;
  return {
    track: {
      keyTimes: [0],
      keySplines: [],
      values: [(CAMERA_WINDOW_WIDTH - sceneWidth) / 2],
      totalSeconds: MIN_DWELL_SECONDS,
    },
    eraTimings: eras.map((_, index) => ({
      dwelled: index === dwelledIndex,
      dwellStartSeconds: 0,
    })),
  };
}

function dwellWeight(era: PlacedEra): number {
  if (era.chapter === null) return DWELL_MULTIPLIER.presentDay;
  if (era.chapter.kind === 'dark-age') return DWELL_MULTIPLIER.darkAge;
  if (BOOM_KINDS.has(era.chapter.kind)) return DWELL_MULTIPLIER.boom;
  return DWELL_MULTIPLIER.light;
}

function baseDwellSeconds(era: PlacedEra): number {
  if (era.chapter === null) return MIN_DWELL_SECONDS * DWELL_MULTIPLIER.presentDay;
  if (era.chapter.kind === 'dark-age') return MIN_DWELL_SECONDS * DWELL_MULTIPLIER.darkAge;
  if (BOOM_KINDS.has(era.chapter.kind)) return MIN_DWELL_SECONDS * DWELL_MULTIPLIER.boom;
  return MIN_DWELL_SECONDS * DWELL_MULTIPLIER.light;
}

function isDarkAge(era: PlacedEra): boolean {
  return era.chapter?.kind === 'dark-age';
}

function clampCameraX(cameraX: number, sceneWidth: number): number {
  const half = CAMERA_WINDOW_WIDTH / 2;
  return Math.min(Math.max(cameraX, half), sceneWidth - half);
}

function toTranslateX(cameraX: number): number {
  return CAMERA_WINDOW_WIDTH / 2 - cameraX;
}

function reportZippedEras(eras: PlacedEra[], dwelledIndices: number[]): void {
  const dwelled = new Set(dwelledIndices);
  const zipped = eras
    .map((era, index) => ({ era, index }))
    .filter(({ index }) => !dwelled.has(index));
  if (zipped.length === 0) return;
  const labels = zipped.map(({ era, index }) => era.chapter?.kind ?? `era-${index}`);
  console.warn(`camera track zipped ${zipped.length} era(s): ${labels.join(', ')}`);
}
