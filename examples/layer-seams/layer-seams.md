# Phase 3 — reusable layer seams

Two byte-preserving refactors that open the seams the static export needs. Every
existing golden stays byte-identical; the new surface is two fragments the export
can call with row-local bounds instead of full-strip bounds.

Fixture: `rich-history-account.json`, desert world. `scene.width = 1957`.

## Seam 1 — `renderEraGround(leftX, rightX, eras, world)`

Was `renderEraGround(width, eras, world)`, pinning the first era to `0` and the
last to `width`. Now takes explicit left/right bounds. Full-strip callers pass
`0` / `scene.width` (byte-identical); the export passes `row.startX` / `row.endX`.

Full strip — `renderEraGround(0, 1957, eras, desert)` (first rect reaches 0, last reaches 1957):

```
<g transform="translate(24,0)"><rect x="-24" y="210" width="220" height="90" fill="#b9793d"/></g>...<g transform="translate(1749,0)"><rect x="0" y="210" width="208" height="90" fill="#e6bd7f"/></g>
```

Row bounds — `renderEraGround(24, 415, firstTwoEras, desert)` (band spans exactly [24, 415], no overrun):

```
<g transform="translate(24,0)"><rect x="0" y="210" width="196" height="90" fill="#b9793d"/></g><g transform="translate(208,0)"><rect x="0" y="210" width="207" height="90" fill="#b9793d"/></g>
```

## Seam 2 — `renderLegend(anchorWidth, world)`

Was a private helper inside `renderRibbon`. Now its own export, right-anchored to
`anchorWidth`. `renderRibbon` still calls it, so ribbon output is byte-identical;
the export draws the legend once at the footer.

`renderLegend(640, desert)`:

```
<rect x="499" y="340" width="8" height="8" fill="#f0d5a8"/>...<rect x="543" y="340" width="8" height="8" fill="#8a4a22"/><text x="496" y="348" ... text-anchor="end">Less activity</text><text x="554" y="348" ... text-anchor="start">More activity</text>
```
