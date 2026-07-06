# Phase 6 sample — window-pinned HUD and gated finale

A final rate-0 `<g class="mural-hud">` overlay, emitted after the front plane so it is topmost and
never translated. It holds the persistent subtitle caption and the badge finale. The finale
anchors to `CAMERA_WINDOW_WIDTH` (not `scene.width`), so the freeze frame never clips, and it fades
in exactly as the camera settles on the present-day dwell — the money shot.

## Rich metropolis

Input: `rich-history-account.json` → 9 eras, `scene.width = 1957`. `viewBox="0 0 640 360"`,
73075 bytes. Present-day dwell starts at `12.45s`; finale begin = `dwellStartSeconds +
BEAT_SETTLE_SECONDS` (0.15s) = `12.6s`.

Badges: `JavaScript Specialist · Heavy PR Contributor · Followed · Star Magnet`.

### The HUD overlay

```
<g class="mural-hud">
  <text x="24" y="28" font-size="13" text-anchor="start" …>saga-weaver · JavaScript artisan</text>
  <g class="mural-finale" opacity="0">
    <rect x="68.7" y="84" width="555.3" height="34" rx="6" fill="#fbe3bd" stroke="#3a2417" …/>
    <text x="346.35" y="105.2" font-size="12" text-anchor="middle" …>JavaScript Specialist · Heavy PR Contributor · Followed · Star Magnet</text>
    <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="12.6s" fill="freeze"/>
  </g>
</g>
```

- Subtitle at `x=24 y=28`, opacity 1 from `t=0` — window-relative, so it stops panning with the
  strip and stays top-left.
- Finale panel right edge at `68.7 + 555.3 = 624 = 640 − 16` — anchored to the camera window, well
  inside the wider `1957px` strip. Left edge `68.7 ≥ 16` side margin.
- Panel y-band `[84, 118]` sits inside the sky band (`skyBottom = 150`), clear of era titles
  (`y=52`) and metropolis rooftops.
- Base `opacity="0"` hides the finale until its `begin`; the `fill="freeze"` fade settles it at
  opacity 1 and holds — coinciding with the camera freeze on present-day.

## Narrow window

The finale font shrinks toward `MIN_FONT_SIZE` (7) when the badge line would overflow the
`640 − 32 = 608px` usable width, keeping the panel inside the camera window rather than clipping the
left edge (shrink logic lives in `renderBadgeFinale`; the HUD only fixes `anchorWidth = 640`).

## Guarantees

- HUD is last in document order and carries no translate (rate 0).
- Subtitle present at opacity 1; finale anchored to `CAMERA_WINDOW_WIDTH`, not `scene.width`.
- Finale opacity-gated with `begin` = present-day `dwellStartSeconds + 0.15s`, via `formatSvgNumber`.
- Embed-safe (`expectEmbedSafeSvg`); byte-identical re-render.
