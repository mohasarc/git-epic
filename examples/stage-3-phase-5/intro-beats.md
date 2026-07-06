# Phase 5 sample — per-era intro beats

Each **dwelled** era's road-coupled content (`renderEraStructures` + `renderEraMotifs` +
`eraTitleText`) is wrapped in one `<g class="mural-era">` that rises and fades in as the camera
settles on it. Zipped eras render the same content, present at full opacity, no beat. The pan
lives on the outer `front` plane (translateX); each era group carries its own translateY +
opacity — transforms compose by nesting.

## Rich metropolis

Input: `rich-history-account.json` → 9 eras, `scene.width = 1957`. `viewBox="0 0 640 360"`,
72365 bytes. 6 eras dwelled, 3 zipped (`origin`, `prolificacy`, `language-era`).

Beat begin = `eraTimings[i].dwellStartSeconds + BEAT_SETTLE_SECONDS` (0.15s), settled after the
camera arrives. One opacity beat + one translateY beat per dwelled era → 12 animates total
(`≤ MAX_DWELLED_ERAS × 2 = 12`).

| era | title | dwell start | beat begin | beat |
| --- | --- | --- | --- | --- |
| 0 | THE FOUNDING | — | — | zip, opacity 1 |
| 1 | THE YEAR OF ABUNDANCE | — | — | zip, opacity 1 |
| 2 | THE LONG CAMPAIGN | 0.00s | `0.15s` | rise + fade |
| 3 | THE FLAGSHIP RISES | 2.39s | `2.54s` | rise + fade |
| 4 | A GATHERING OF STARS | 4.77s | `4.92s` | rise + fade |
| 5 | THE DARK AGE | 7.16s | `7.31s` | rise + fade |
| 6 | THE GREAT REFACTOR | — | — | zip, opacity 1 |
| 7 | A GATHERING OF STARS | 10.06s | `10.21s` | rise + fade |
| 8 | PRESENT DAY | 12.45s | `12.6s` | rise + fade (freeze frame) |

### A dwelled era group (era 2)

```
<g class="mural-era" opacity="0" transform="translate(0,8)">
  … structures + motifs + title …
  <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="0.15s" fill="freeze"/>
  <animateTransform attributeName="transform" type="translate" from="0 8" to="0 0"
    dur="0.5s" begin="0.15s" fill="freeze"/>
</g>
```

Base state `opacity="0"` + `translate(0,8)` holds the content hidden and 8px low until its
`begin`; both beats `fill="freeze"` so it settles at opacity 1 / `0 0` and stays.

### A zipped era group (era 0)

```
<g class="mural-era"> … structures + motifs + title … </g>
```

No beat, no base opacity — present from `t=0` and streaks past under the pan.

## Sub-window grace floor

Brand-new no-activity account → 1 era, `scene.width = 184 ≤ 640`. The front plane holds a static
centered translate; every era group is plain (`<g class="mural-era">…</g>`), no beat — a complete
still, never a half-faded hold.

## Guarantees

- Beat count = dwelled-era count × 2, capped at 12.
- Each dwelled era's `begin` = its `dwellStartSeconds + 0.15s`, via `formatSvgNumber` — fixed,
  deterministic.
- Beat groups nest inside the panning `front` plane; zipped eras and the sub-window carry none.
- Embed-safe (`animate`/`animateTransform`/`from`/`to`/`begin` pass `expectEmbedSafeSvg`).
- Byte-identical re-render.
