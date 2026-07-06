# Phase 4 sample — animated renderer: depth planes and the pan

`renderAnimatedMuralSvg(scene)` — the renderer skeleton. Three parallax planes framed by the
camera window (`CAMERA_WINDOW_WIDTH = 640`, `MURAL_HEIGHT = 360`), each translated by the
dwell-and-zip track from `buildCameraTrack`. No beats, HUD, or ambient yet (Phases 5–7). Not
yet wired into `renderMural`.

## Rich metropolis (pan)

Input: `rich-history-account.json` → 9 eras, `scene.width = 1957`. `viewBox="0 0 640 360"`,
70642 bytes.

```
<svg ... viewBox="0 0 640 360" role="img">
  <title>…</title><desc>…</desc>
  <g class="mural-plane back"> renderSky(640) </g>              rate 0, no translate
  <g class="mural-plane mid">  renderDistantBand(2747.2) + animateTransform </g>
  <g class="mural-plane front"> eraGround + road + structures + motifs + ribbon + titles + animateTransform </g>
</svg>
```

**FRONT pan** (rate 1.0) — track values verbatim:

```
<animateTransform attributeName="transform" type="translate" dur="15s" calcMode="spline"
  keyTimes="0;0.12;0.16;0.28;0.32;0.44;0.48;0.63;0.67;0.79;0.83;1"
  keySplines="0 0 1 1;0.42 0 0.58 1;…;0 0 1 1"
  values="-175.5 0;-244.5 0;-405.5 0;-474.5 0;-627.45 0;-689.55 0;-888.5 0;-888.5 0;-1285.95 0;-1317 0;-1289.4 0;-1317 0"
  fill="freeze"/>
```

`fill="freeze"`, no `repeatCount` → plays once, holds on the present-day center (`-1317 = 640 − 1957`).

**MID parallax** (rate 0.4) — same `keyTimes`/`keySplines`, values scaled ×0.4:

```
values="-70.2 0;-97.8 0;-162.2 0;-189.8 0;-250.98 0;-275.82 0;-355.4 0;-355.4 0;-514.38 0;-526.8 0;-515.76 0;-526.8 0"
```

Distant band extended on the trailing edge so the slower plane still covers the window:

```
maxPanSpan = 1957 − 640 = 1317
bleed      = (1 − 0.4) × 1317 = 790.2
band width = 1957 + 790.2 = 2747.2
```

**BACK sky** — window-width gradient, rate 0, no `transform`, no `animateTransform`.

## Sub-window grace floor (no pan)

Input: brand-new no-activity account → 1 era, `scene.width = 184 ≤ 640`. Every plane holds a
static centered translate; no `animateTransform` anywhere. 4772 bytes.

```
centered = (640 − 184) / 2 = 228
<g class="mural-plane front" transform="translate(228,0)"> … </g>
<g class="mural-plane mid"   transform="translate(228,0)"> … </g>
```

## Guarantees

- Exactly three depth planes; sky carries no translate.
- FRONT `values` = track values; MID = track values × 0.4; shared `keyTimes`/`keySplines`.
- Embed-safe (`animateTransform`/`calcMode`/`keySplines` pass `expectEmbedSafeSvg`).
- Deterministic — byte-identical re-render.
