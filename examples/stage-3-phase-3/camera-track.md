# Phase 3 sample — dwell-and-zip camera track

`buildCameraTrack(eras, sceneWidth)` — the pure pass. No SVG. Non-visual: this is the model the animated renderer (Phase 4+) stamps into `animateTransform`s.

Input: `rich-history-account.json` → 9 eras, `sceneWidth = 1957`, `CAMERA_WINDOW_WIDTH = 640`.

## Selection

9 eras, cap 6. Present-day forced. Remaining fill by dwell-weight desc (dark-age > boom > light), tie-break recency (later index wins).

```
idx  kind            weight  dwelled
0    origin          light   zipped
1    prolificacy     boom    zipped
2    great-streak    boom    ✓
3    flagship-rise   boom    ✓
4    star-milestone  boom    ✓
5    dark-age        dark    ✓
6    language-era    light   zipped
7    star-milestone  boom    ✓
8    present-day     —       ✓ (freeze)
```

Cap binds → `console.warn`: `camera track zipped 3 era(s): origin, prolificacy, language-era`.

Two equal-weight star-milestones (idx4, idx7): both survive here; when the cap forces a drop between equal booms, the later index is kept (see `laidOutEras` tie-break test).

## Track

```
totalSeconds = 15            (∈ [12, 18])
```

Each dwelled era is a pair of translateX stops (a small drift, near-linear `0 0 1 1`); zips between stops ease-in-out `0.42 0 0.58 1`. Dark-age (idx5) drifts near-zero — a lonely hold. Final stop is present-day centered (`values` end `-1317 = 640 − 1957`), reached by a dwell, no trailing zip.

```
keyTimes   [0, 0.12, 0.16, 0.28, 0.32, 0.44, 0.48, 0.63, 0.67, 0.79, 0.83, 1]
values     [-175.5, -244.5, -405.5, -474.5, -627.45, -689.55, -888.5,
            -888.5, -1285.95, -1317, -1289.4, -1317]
keySplines [dwell, zip, dwell, zip, dwell, zip, dwell, zip, dwell, zip, dwell]
```

## Era timings (index-aligned to `scene.eras`)

```
idx  dwelled  dwellStartSeconds
0    false    0
1    false    0
2    true     0
3    true     2.39
4    true     4.77
5    true     7.16
6    false    0
7    true     10.06
8    true     12.45     ← present-day, finale settles here
```

## Grace floors

- **Sub-window** (`sceneWidth ≤ 640`): single centered stop, `values = [(640 − sceneWidth)/2]`, no pan.
- **Low count** (`dwelledCount ≤ 2`): `totalSeconds` allowed below 12 rather than pad a near-static hold.
