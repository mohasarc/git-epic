# Phase 1 output preview — row packing

Phase 1 is the pure row-packing model behind the static export. No SVG yet, so the
preview is the literal `packEraRows` output.

**Input:** `rich-history-account.json` scene → 9 placed eras, `strip.width = 1957`.
**Call:** `packEraRows(scene.eras, STATIC_ROW_WIDTH /* 640 */)`.

**Output:** 4 stacked rows (matches `reference-images/02-flat-mural-variant.png` — four
rows), eras kept in chapter order, no era split across rows.

```
row 0: y=48   startX=24    endX=645   width=621
    THE FOUNDING          x=24    width=184
    THE YEAR OF ABUNDANCE x=208   width=207
    THE LONG CAMPAIGN     x=415   width=230
row 1: y=424  startX=645   endX=1082  width=437
    THE FLAGSHIP RISES    x=645   width=230
    A GATHERING OF STARS  x=875   width=207
row 2: y=800  startX=1082  endX=1542  width=460
    THE DARK AGE          x=1082  width=253
    THE GREAT REFACTOR    x=1335  width=207
row 3: y=1176 startX=1542  endX=1933  width=391
    A GATHERING OF STARS  x=1542  width=207
    PRESENT DAY           x=1749  width=184
```

`rowY(index) = HEADER_HEIGHT + index * (MURAL_HEIGHT + ROW_GAP)` → rows step
`360 + 16 = 376` apart (48, 424, 800, 1176). Each `row.width = lastEra.x +
lastEra.width - firstEra.x`; a row never exceeds `STATIC_ROW_WIDTH` unless a single era
does (then that era gets its own row, never split).
