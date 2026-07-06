# Phase 4 — the row-wrapped static export

`renderStaticExport(scene, world, contributionDays)` re-lays the same mural as
full-width stacked rows: each row a mural slice with its own exact per-day ribbon,
closing on the badge-finale panel and one shared footer legend. No SMIL, no raster.

Same data, story, and badges as the animated SVG — re-laid-out, not re-derived.

## Rich account, desert (`rich-history-account.json`)

`scene.width = 1957` (too wide for one row) wraps into **4 rows** at
`STATIC_ROW_WIDTH = 640`, matching the four-row reference layout.

- Document: `688 × 1812`, `viewBox="0 0 688 1812"` (`STATIC_ROW_WIDTH + 2·MARGIN`
  wide; header + 4 rows + 3 gaps + finale + footer tall).
- Each row: a `<clipPath>` at `[0, row.width] × 360`, a full-width backdrop
  (sky, distant band, road) drawn with no shift, and era-absolute content
  (ground, structures, motifs, exact ribbon, era titles) shifted by `-row.startX`
  into the row frame.
- Badge finale below the last row, anchored to the content width.
- One footer legend (`Less activity` … `More activity`).

Render: [`rich-desert.svg`](rich-desert.svg) (42553 bytes).

## Same account, mountain world

Identical layout, stone tiers. Render: [`rich-mountain.svg`](rich-mountain.svg)
(42589 bytes) — the grey-green stone edges past desert by a few dozen bytes.

## Grace floor — single commit, desert (`single-contribution-account.json`)

`scene.width = 320` → **1 row**, one clipPath, still a complete framed export with
finale and legend. Never empty, never a crash. Render:
[`single-commit-desert.svg`](single-commit-desert.svg) (4252 bytes).

## To eyeball on a real render

The ribbon under each row is the **exact** per-day activity chart on a true time
axis (one column per real day), decoupled from era pixel width. Under a long-dwell,
low-activity era the ribbon reads as a thin slice offset from the wide structure
above it — intended (exact chart vs. faithfully-under-each-structure). This is the
one honest divergence from the compressed SVG ribbon.
