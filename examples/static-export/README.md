# Static image export

A motion-free image export: the same mural re-laid as full-width stacked rows (the
strip wrapped like paragraphs), each row carrying its own **exact per-day**
contribution ribbon on a true time axis, closing on the badge finale and one shared
footer legend. Same data, story, and badges as the animated epic — re-laid-out, not
re-derived. Still SVG, no SMIL, no raster.

## Input → output

```ts
import { renderMuralExport } from 'git-epic';

renderMuralExport(snapshot);            // desert (default)
renderMuralExport(snapshot, 'river');
renderMuralExport(snapshot, 'mountain');
```

On the image endpoint, `?preview=mural-static` selects it:

```
/<handle>.svg?preview=mural-static
/<handle>.svg?preview=mural-static&world=mountain
```

`?world=` still picks the world; absent, it hash-defaults off the handle. The default
embed (no `preview`) and `?preview=mural` are untouched.

## Samples — `saga-weaver` (`test-fixtures/rich-history-account.json`)

`scene.width = 1957` is too wide for one row, so it wraps into **4 rows** at
`STATIC_ROW_WIDTH = 640`: document `688 × 1812`, `viewBox="0 0 688 1812"`. Same scene
across the three worlds — only palette and the two per-world signatures change.

| world | sample |
| --- | --- |
| desert | [`saga-weaver.desert.svg`](./saga-weaver.desert.svg) |
| river | [`saga-weaver.river.svg`](./saga-weaver.river.svg) |
| mountain | [`saga-weaver.mountain.svg`](./saga-weaver.mountain.svg) |

## Grace floor — one commit

`first-spark` (`test-fixtures/single-contribution-account.json`) → `scene.width = 320`
→ **1 row**, document `688 × 684`, still a complete framed export with finale and
legend. Never empty, never a crash:
[`single-commit.desert.svg`](./single-commit.desert.svg).

## To eyeball on a real render

The ribbon under each row is the exact per-day activity chart on a true time axis (one
column per real day), decoupled from era pixel width. Under a long-dwell, low-activity
era the ribbon reads as a thin slice offset from the wide structure above it —
intended (exact chart vs. faithfully-under-each-structure), the one honest divergence
from the compressed animated ribbon. It is the single thing worth eyeballing.

## Parked for Stage 6

- **`.png` URL and real rasterization** — deferred to Stage 6, or dropped if raster is
  never added. Stage 5's export is the still SVG behind `?preview=mural-static`;
  whether `<handle>.png` ever emits PNG bytes vs. aliases this SVG is not decided here.
- **Default-embed cutover** — Stage 6 owns making this (or the animated epic) the
  README default. No README change here.
