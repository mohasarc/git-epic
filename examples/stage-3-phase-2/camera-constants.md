# Phase 2 sample — camera geometry constants and track types

Foundations, no behavior. These are the values the pure camera model (Phase 3) and the animated renderer (Phase 4+) build on. Non-visual: nothing renders yet.

## Camera window (`mural-vocabulary.ts`)

```
CAMERA_WINDOW_WIDTH = 640
```

Frames ~3–4 eras at once (era widths ≈ 136–253px). The finale panel anchors to this width so the freeze frame never clips. Static constants (`MURAL_HEIGHT`, `Y_BANDS`, `MURAL_PALETTE`, `MURAL_BYTE_CEILING`) unchanged.

## Timing + plane constants (`camera-track.ts`)

```
TOTAL_REPLAY_SECONDS = 15      REPLAY_MIN_SECONDS = 12    REPLAY_MAX_SECONDS = 18
MIN_DWELL_SECONDS    = 1.4     ZIP_SECONDS = 0.6          BEAT_SETTLE_SECONDS = 0.15
MAX_DWELLED_ERAS     = 6
PLANE_RATE = { sky: 0, distantBand: 0.4, front: 1 }
```

Invariants (asserted): `REPLAY_MIN < TOTAL_REPLAY < REPLAY_MAX`; `ZIP < MIN_DWELL`; `BEAT_SETTLE < MIN_DWELL`; `sky < distantBand < front`.

## Track type

```ts
type CameraTrack = {
  track: { keyTimes: number[]; keySplines: string[]; values: number[]; totalSeconds: number };
  eraTimings: { dwelled: boolean; dwellStartSeconds: number }[]; // index-aligned to scene.eras
};
```

Example instance:

```ts
{
  track: { keyTimes: [0, 1], keySplines: ['0.4 0 0.2 1'], values: [0, -100], totalSeconds: 15 },
  eraTimings: [
    { dwelled: true, dwellStartSeconds: 0 },
    { dwelled: false, dwellStartSeconds: 0 },
  ],
}
```
