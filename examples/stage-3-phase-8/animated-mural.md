# Stage 3 sample — the animated mural at the preview surface

Phase 8 repoints `renderMural` from the static full-strip `renderMuralSvg` to
`renderAnimatedMuralSvg`. The `?preview=mural` surface now serves the baked dwell-and-zip
animation: a camera pans the strip, dwells on the strongest eras with a rise-and-fade beat, zips
through the rest, freezes on the present-day finale, then rests in the trailing-window ambient loops.
No JavaScript, no external refs, deterministic per user.

Golden: [`rich-history-account.svg`](rich-history-account.svg).

## Input → output

Input: `rich-history-account.json` → 9 eras, `scene.width = 1957`.

```
renderMural(snapshot)
  → <svg ... width="640" height="360" viewBox="0 0 640 360" role="img"> … </svg>
```

- `viewBox` is the camera window (`CAMERA_WINDOW_WIDTH` × `MURAL_HEIGHT` = 640 × 360), not the full
  1957-wide strip. The pan slides the strip behind that window.
- 73250 bytes — under `MURAL_ANIMATED_BYTE_CEILING` (75850). Worst case measured is the
  fifteen-year overflow at 75371 bytes.

## What the animation does (real values)

| Property | rich-history | fifteen-year overflow |
| --- | --- | --- |
| eras | 9 | 9 |
| dwelled (≤ `MAX_DWELLED_ERAS` = 6) | 6 | 6 |
| zipped | origin, prolificacy, language-era | origin, flagship-rise, language-era |
| `totalSeconds` | 15.00 | 15.00 |
| rest window `[width − 640, width]` | `[1317, 1957]` | `[1432, 2072]` |

- **Plays once, freezes.** The pan `<animateTransform type="translate" calcMode="spline" …
  fill="freeze"/>` carries no `repeatCount`. Its final value is `640 − 1957 = -1317`: the camera
  ends at the right edge, centered on the present-day dwell — the freeze frame.
- **Dwell readable, zip smooth.** Dwell segments use the near-linear `0 0 1 1` keyspline; zips use
  the ease-in-out `0.42 0 0.58 1`. Each dwelled era rises and fades in
  (`attributeName="opacity" from="0" to="1"`) as the camera settles.
- **Rests.** Motifs seated in the rest window loop forever (`repeatCount="indefinite"`): banners
  sway, gold glows, crowds bob. See [phase-7 ambient sample](../stage-3-phase-7/ambient-loops.md).

## Grace floor

Sub-window accounts (`scene.width ≤ 640`: single-commit, brand-new) render a complete centered still
— a single `transform="translate((640 − width)/2, 0)"`, no pan, no `calcMode="spline"`, no crash.

## Guarantees held (done-when suite)

- Pan freezes with no repeat; ambient loops indefinitely; final stop is the present-day center.
- Dense animated render under `MURAL_ANIMATED_BYTE_CEILING`; multi-era `totalSeconds ∈ [12,18]`
  (below 12 only when `dwelledCount ≤ 2`).
- Embed-safe with an XML-hostile handle; byte-identical re-render; `buildCameraTrack` idempotent.
- Static path untouched: the cosmic embed, `renderMuralSvg`, and every Stage-1/2 unit golden stay
  byte-identical. Motion appears only through the repointed `renderMural`; `renderMuralSvg` carries
  no `<animate>`.
