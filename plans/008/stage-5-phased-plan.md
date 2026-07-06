# Stage 5 phased plan — static image export

Phased implementation plan for [Stage 5 of the visual-system staged plan](stages.md#stage-5--static-image-export): a motion-free image export that re-lays the same world as stacked rows (the mural wrapped like paragraphs), with the exact true contribution ribbon under each row, all plaques, and the badge finale. Same data, story, strengths, and badges as the animated SVG — re-laid-out, not re-derived. Still behind preview; the default embed and every earlier golden stay byte-identical.

## Goal

Add a third render surface: `renderMuralExport(snapshot, world)` → a still SVG that packs the mural's eras into stacked full-width rows, draws each row's own **exact per-day** contribution ribbon on a true time axis, and closes on a dedicated badge-finale panel and one shared footer legend. Reachable behind `?preview=mural-static`. No SMIL, no baked raster, no rasterizer dependency — the "static image export" is a motion-free SVG (§6.9 forbids raster; §7 requires byte-stable determinism). Deterministic (`identical (data, world) → identical bytes`), embed-safe.

Reference image `reference-images/02-flat-mural-variant.png` is the literal target: four stacked rows, each a mural slice with its own ribbon underneath, chapter markers along each row's top, one shared legend + footer at the bottom, rows broken at era boundaries.

## Context

Stage 1 delivered the pure `MuralScene` (`build-mural-scene.ts`, `mural-scene.ts`) and the static full-strip `renderMuralSvg` (`render-mural-svg.ts`). Stage 3 added `renderAnimatedMuralSvg` and repointed `renderMural` (`render-mural.ts`) to it. Stage 4 threaded a `World` through both renderers and the shared layers (`worlds/` catalog, `resolveWorldName`). The service resolves `?preview=mural` → `EpicVariant 'mural'` (`route-service-request.ts` `parseVariant`) and caches under `${handleKey}:mural:${worldName}` (`handle-image-request.ts`).

Both existing renderers compose the same per-layer fragments, all taking a `world: World`:
- `renderSky(width, world)`, `renderDistantBand(width, world)` + `renderEraGround(width, eras, world)` (`terrain.ts` — already two separate exports), `renderRoad(width, world)`, `renderStructures(eras, worldScale, world)`, `renderMotifs(eras, worldScale, world)`, `renderRibbon(eras, stripWidth, world)`, `renderText(scene)` / `eraTitleText` + `renderSubtitle`, `renderBadgeFinale(scene, world)`, `renderAccessibility(scene)`.

Objects are era-absolute: `renderStructures`/`renderMotifs` place everything under `translate(era.x)`; ribbon columns and motifs carry absolute x. The scene's ribbon is **compressed** — `bucketRibbon` (`ribbon-buckets.ts`) buckets each era's days into fixed-**pixel**-pitch columns (`round(eraWidth / RIBBON_PITCH)`). The static export must instead show the **exact** chart: one column per real day, on a true time axis (§6.6, §8.6). `MuralScene` does not carry raw `contributionDays`; `buildMuralScene` consumes then discards them (`build-mural-scene.ts`).

`renderLegend` is currently buried inside `renderRibbon` (`ribbon.ts`), anchored right at `stripWidth-24`, fixed `LEGEND_Y=348`. `renderBadgeFinale` paints at fixed `PANEL_TOP=84` (a sky-band Y) and already takes an `anchorWidth`. `renderEraGround` pins the first era's left edge to `0` and the last era's right edge to the strip width. Vertical geometry is `Y_BANDS` (sky 0-150, horizon 150-210, road baseline 300, ribbon 300-331) with `MURAL_HEIGHT=360`. Byte ceilings (`MURAL_BYTE_CEILING`, `MURAL_ANIMATED_BYTE_CEILING`) are calibrated from real measured worst cases in `mural-vocabulary.ts`.

## Guiding constraints (from the visual spec and staged plan)

- **Still SVG, not raster.** §6.9 forbids baked raster; the repo carries no rasterizer and requires byte-stable output. The export is an SVG with no `<animate*>`/`dur=`/SMIL. The literal `<handle>.png` URL scheme and any real rasterization are a **Stage-6 decision, not decided here**.
- **Same story, re-laid-out (§8.2).** Not a different story than the SVG. Story and badge parity is guaranteed **by construction** — the export builds the scene through the identical `detectChapters → narrate → scoreStrengths → buildMuralScene` path, extracted into one shared helper both renderers call.
- **Exact ribbon (§6.6, §8.6).** One column per real day — "exact" in explicit contrast to the SVG's compressed pixel-pitch `bucketRibbon`. Bytes are controlled mechanically (floor band + run-length merge), never by re-defining "exact" as weekly. Weekly is a recorded fallback only if per-day proves to blow a real budget.
- **True time axis.** The ribbon is time-linear within each row (row date span mapped linearly across the row width), decoupled from era pixel width — unlike the SVG where column width tracks dwell-weighted era pixels. This is the honest "exact activity chart."
- **Wrap at era boundaries.** An era is the atomic wrap unit — the scene binds ribbon columns and motifs to era-local coordinates, so cutting mid-era would sever a structure and desync the ribbon. Never split an era.
- **Grace floor holds.** Single-commit → one short row; zero-activity → one floor-band camp row. Never empty, never crash. Inherited from `buildMuralScene`'s camp floor.
- **Bounded off-GitHub file.** The export is for off-GitHub sharing (X, Slack, blogs), not the embed size gate — but a separate measured byte ceiling guards regression, matching the two existing ceilings.
- **Reuse, don't rewrite.** Assemble from existing layer fragments via translate + a handful of row-width/row-bounds params + three once-per-doc lifts. No layer gets a rewrite; `render-mural-svg.ts` and `render-animated-mural-svg.ts` are not touched.
- **TDD.** Red test first every phase (`CLAUDE.md`).

## Architecture at a glance

- **New module** `src/mural/render-static-export.ts` exporting `renderStaticExport(scene: MuralScene, world: World, contributionDays: ContributionDay[]): string`. It does not touch the two existing renderers.
- **Row model** (pure): `packEraRows(eras: PlacedEra[], rowWidth: number): ExportRow[]` where `ExportRow = { eras: PlacedEra[]; startX: number; endX: number; width: number; index: number }`. Greedy pack in chapter order to `STATIC_ROW_WIDTH`, never split an era, empty-row-always-accepts. `rowY(index) = HEADER_HEIGHT + index * (MURAL_HEIGHT + ROW_GAP)`.
- **Exact ribbon model** (pure, new): `buildExactRibbon(row, contributionDays): RibbonColumn[]` — slice `contributionDays` (sorted ISO dates) to the row's `[firstEra.startDate, lastEra.endDate]`, one column per day, x mapped time-linearly across `row.width`, density `count / RIBBON_SATURATION_COUNT` floored at `RIBBON_MIN_DENSITY` (same ramp as the SVG), then a single floor band for min-density days + run-length merge of equal-density adjacent days to bound rect count. Reuses `ribbonColumnColor`, `RIBBON_SATURATION_COUNT=5`, `RIBBON_MIN_DENSITY=0.08` from the existing ribbon layer.
- **Per-row render** = two sibling groups under the row's `rowY`:
  - **backdrop** at `translate(0, rowY)` — `renderSky(row.width, world)`, `renderDistantBand(row.width, world)`, road spanning `[0, row.width]`; drawn with `row.width`, **no `-startX` shift**.
  - **content** at `translate(-row.startX, rowY)` — `renderStructures(row.eras, worldScale, world)`, `renderMotifs(row.eras, worldScale, world)`, the exact-ribbon columns, and per-row era-title markers (`eraTitleText`, era-absolute, shift correctly). Era-ground drawn with explicit `row.startX`/`row.endX` bounds.
  - each row wrapped in a `<clipPath>` at `[0, row.width] × MURAL_HEIGHT` to contain `SEAM_FEATHER` overrun and edge structures.
- **Document frame** (rendered once, anchored to the export content width, never `scene.width`): doc order `renderAccessibility(scene)` → one subtitle header line (`scene.subtitle`) → rows → badge-finale panel (`renderBadgeFinale` wrapped in `translate(0, finaleY-84)`, `anchorWidth=contentWidth`) → shared footer legend (`renderLegend` extracted from `renderRibbon`).
- **Constants** (new, in `mural-vocabulary.ts`): `STATIC_ROW_WIDTH` (seed 640), `ROW_GAP` (seed 16), export side `MARGIN`, `HEADER_HEIGHT`, `FINALE_HEIGHT`, `FOOTER_HEIGHT`, and `STATIC_EXPORT_BYTE_CEILING` (measured). Export width = `STATIC_ROW_WIDTH + 2*MARGIN`; height = header + `rows*MURAL_HEIGHT + (rows-1)*ROW_GAP` + finale + footer.
- **Entry / parity**: extract the shared scene build (`detect→narrate→score→buildMuralScene`) into one helper (e.g. `buildSceneFromSnapshot`) called by both `renderMural` and the new `renderMuralExport(snapshot, world: WorldName = 'desert')`; the latter looks up `worlds[world]` and passes `snapshot.contributionDays`.
- **Service**: `parseVariant` maps `?preview=mural-static` → new `EpicVariant 'static'`; `handleImageRequest` gets a `'static'` branch calling `renderMuralExport`, cache key `${handleKey}:static:${worldName}`. Cosmic and mural paths untouched.

## Phases

## Phase 1 — Row packing and export geometry constants

Pure row-packing model and the export's geometry constants. No SVG yet.

- Add `STATIC_ROW_WIDTH` (640), `ROW_GAP` (16), `MARGIN`, `HEADER_HEIGHT`, `FINALE_HEIGHT`, `FOOTER_HEIGHT` to `mural-vocabulary.ts` (named for what they are, not reusing `CAMERA_WINDOW_WIDTH` — the camera window is an animated-viewport concern and must diverge freely).
- `ExportRow` type; `packEraRows(eras, rowWidth): ExportRow[]` — greedy over chapter-ordered eras: start a row, keep adding while `runningWidth + era.width <= rowWidth`, else close the row and start a new one; an empty row always accepts the next era (never-split invariant, defensive — max era width ~253px never triggers it). Each row records `startX` (its first era's x), `endX`, `width = endX - startX`, `index`.
- `rowY(index)` helper from the constants.

**Test cases.** Eras totaling < one row → one row holding all. Eras totaling > one row → greedy split at the boundary, chapter order preserved, no era in two rows. Union of all rows' eras == input eras, in order. A single era wider than `STATIC_ROW_WIDTH` (synthetic) → its own row (never dropped, never split). `row.width == lastEra.x + lastEra.width - firstEra.x`. Deterministic: same eras → same rows. `rowY` spacing == `MURAL_HEIGHT + ROW_GAP`.

**Commit plan.**
1. `feat: add export geometry constants`
2. `feat: pack mural eras into export rows`

## Phase 2 — Exact per-day contribution ribbon

The one genuinely-new ingredient: the exact activity chart, isolated and tested hard before any SVG assembly.

- `buildExactRibbon(row: ExportRow, contributionDays: ContributionDay[]): RibbonColumn[]`. Row span = `[firstEra.startDate, lastEra.endDate]`. One entry per day in the span; `count` from `contributionDays` (0 if absent). Column x is **time-linear**: `startX_local + (dayOffset / spanDays) * row.width`; uniform px-per-day within the row. `density = min(1, max(RIBBON_MIN_DENSITY, count / RIBBON_SATURATION_COUNT))`.
- Byte control, applied to the model (not regex over SVG): emit one floor band spanning min-density runs, and run-length-merge adjacent equal-density days into a single wider column. Merge preserves total counts.
- Reuse `RIBBON_SATURATION_COUNT`, `RIBBON_MIN_DENSITY`, `ribbonColumnColor` from `ribbon.ts` (export them if not already).

**Test cases.** **Conservation** (the proof of "exact"): sum of counts across the intermediate day→column model == sum of `contributionDays` counts within the row span — assert at the model layer, before RLE-merge. **Resolution**: column count reflects day count, not `round(width/RIBBON_PITCH)` — a dense era yields far more columns than `bucketRibbon` would. **Time-linear**: two eras of different pixel width but equal day span get equal ribbon width; column x is uniform per day. **Floor**: an all-quiet span → all columns at `RIBBON_MIN_DENSITY`, still visible, one merged band. **Determinism**: same input → identical columns. **Edge**: empty `contributionDays` for the row → full floor band, no crash.

**Commit plan.**
1. `feat: build the exact per-day export ribbon`

## Phase 3 — Reusable layer seams (byte-preserving)

Two small refactors that open the seams the export needs, keeping every existing golden byte-identical.

- **Era-ground bounds.** Give `renderEraGround` explicit left/right bounds (`renderEraGround(leftX, rightX, eras, world)` or an added optional bounds param) instead of pinning first-era `startX=0` / last-era `endX=stripWidth`. The full-strip callers pass `0`/`scene.width`, preserving exact current output; the export passes `row.startX`/`row.endX`.
- **Legend extraction.** Extract `renderLegend(anchorWidth, world)` as its own export from `renderRibbon`; `renderRibbon` calls it so its output is byte-identical. The export draws the legend once at the footer instead.

**Test cases.** Every existing static + animated golden and the layer goldens stay byte-identical (the guard). New: `renderEraGround` with `0`/`scene.width` bounds equals its prior output; with row bounds, ground rects span exactly `[leftX, rightX]` and don't overrun. `renderRibbon` output unchanged; `renderLegend` alone emits the swatches + `Less activity`/`More activity` at the given anchor width.

**Commit plan.**
1. `refactor: give era-ground explicit row bounds`
2. `refactor: extract the ribbon legend as its own fragment`

## Phase 4 — The static export renderer

Assemble the still SVG from Phases 1–3: per-row backdrop + content groups with clip, the exact ribbon, the document frame.

- `renderStaticExport(scene, world, contributionDays)`:
  - Pack rows (`packEraRows`).
  - Compute export width (`STATIC_ROW_WIDTH + 2*MARGIN`) and height (header + rows + gaps + finale + footer); emit `<svg>` with a fitted `viewBox`, `role="img"`, `renderAccessibility(scene)`.
  - One subtitle header line (`scene.subtitle`).
  - Per row: `<clipPath>`; backdrop group `translate(0, rowY)` with `row.width`; content group `translate(-row.startX, rowY)` with structures, motifs, exact-ribbon columns (`buildExactRibbon` + `ribbonColumnColor`), era-ground with row bounds, per-row era-title markers.
  - Badge-finale panel below the last row: `renderBadgeFinale(scene, world)` wrapped in `translate(0, finaleY-84)`, `anchorWidth=contentWidth` (do not parametrize `PANEL_TOP`).
  - Shared footer legend via `renderLegend(contentWidth, world)`.

**Test cases** (`render-static-export.test.ts` — geometry/structure, the brittle detail kept out of the done-when suite): rows placed at `rowY(index)`, spacing `MURAL_HEIGHT+ROW_GAP`; each row emits a clipPath at `[0,row.width]×MURAL_HEIGHT`; backdrop group has no `-startX` translate, content group does; finale panel below the last row at `anchorWidth=contentWidth`; one legend, one subtitle header, one `<title>`/`<desc>`; `viewBox` matches computed width/height; a multi-row rich fixture yields the expected row count; embed-safe XML (reuse `expectEmbedSafeSvg`).

**Commit plan.**
1. `feat: render the row-wrapped static export`

## Phase 5 — Export byte ceiling

Calibrate and pin the export's regression ceiling from a real measured worst case.

- Measure `renderStaticExport` bytes across the three worlds on the densest fixture (`fifteen-year-overflow` at metropolis), after the Phase-2 floor+RLE compaction. Set `STATIC_EXPORT_BYTE_CEILING` in `mural-vocabulary.ts` just above the honest cross-world max with modest headroom (the discipline the two existing ceilings follow — a measured number, not a round guess).
- Vocabulary test asserting the ceiling is present and above the measured render; a byte test rendering the worst-case fixture through `renderMuralExport` and asserting `< STATIC_EXPORT_BYTE_CEILING`.

**Test cases.** Worst-case dense export across desert/river/mountain stays under the ceiling; the ceiling sits just above the measured max (guard is tight, not a round bump).

**Commit plan.**
1. `test: pin the static export byte ceiling`

## Phase 6 — Entry point, scene-build parity, and service wiring

Wire the export end to end behind `?preview=mural-static`, with story/badge parity guaranteed by a shared scene builder.

- **Extract** the scene build (`detectChapters → narrateChapter → scoreStrengths → buildMuralScene`) from `renderMural` into one helper (`buildSceneFromSnapshot(snapshot)`); `renderMural` calls it (output byte-identical).
- **`renderMuralExport(snapshot, world: WorldName = 'desert')`** in `render-mural.ts`: `buildSceneFromSnapshot`, look up `worlds[world]`, call `renderStaticExport(scene, world, snapshot.contributionDays)`.
- **Service**: `EpicVariant` gains `'static'`; `parseVariant` maps `?preview=mural-static` → `'static'` (keep `preview=mural` → `'mural'`); `handleImageRequest` `'static'` branch → `renderMuralExport`, cache key `${handleKey}:static:${worldName}`. Cosmic and mural paths and keys untouched.

**Test cases.** `renderMural` output byte-identical after the extract. `renderMuralExport(snapshot)` equals `renderMuralExport(snapshot, 'desert')`; badges and era titles equal the scene's (parity by construction). `parseVariant`: `mural-static` → `'static'`, `mural` → `'mural'`, absent → `'cosmic'`. `handleImageRequest`: a `mural-static` request renders the export, caches under `:static:<world>`, and never serves the `:mural:` body for the same handle/world; two worlds → two entries. Cosmic and mural keys unchanged.

**Commit plan.**
1. `refactor: extract the shared scene builder`
2. `feat: add renderMuralExport`
3. `feat: serve the static export behind preview=mural-static`

## Phase 7 — Done-when behavior suite

Pin the stage's Done-when as behavior guarantees only (geometry detail stays in Phase 4's test).

**Test cases** (`render-static-export.done-when.test.ts`):
- **No motion**: no `<animate`, `<animateTransform`, `<animateMotion`, `dur=`, or other SMIL anywhere in the output.
- **Exact chart**: ribbon-count conservation (sum of column counts == sum of `contributionDays`) and per-day resolution (not `bucketRibbon`'s pixel-pitch count).
- **Story + badge parity**: badges == `scene.badges` and era titles == `scene.eras` titles for the same snapshot.
- **Cross-world**: renders a complete export for desert, river, and mountain.
- **Grace floor**: single-commit fixture → one short row; zero-activity fixture → one floor-band camp row; neither empty nor a crash.
- **Determinism**: identical bytes on re-render of the same `(snapshot, world)`.
- **XML-hostile handle**: reuse the existing hostile fixture; output stays embed-safe.

**Commit plan.**
1. `test: pin the stage-5 static-export done-when suite`

## Phase 8 — Examples and docs

Update examples and docs per the project rule; record the parked decisions.

- Add `examples/static-export/` (descriptive name — **not** `examples/stage-5*`, which are 000-era error-card leftovers) with a committed sample `.md`: handle input → rendered Output-preview sample across a world, noting the `?preview=mural-static` URL. Include at least one rendered sample SVG.
- Note in the sample doc / plan that the visible time-linear ribbon under a long-dwell low-activity era shows a thin ribbon slice offset from the structure above it — intended (exact chart vs faithfully-under-each-era), the one thing to eyeball on a real render.
- No README/default-embed change — Stage 6 owns the cutover.

**Commit plan.**
1. `docs: capture the static export sample`

## Open questions (recorded, resolved where the phase notes say)

- **`.png` URL scheme and real rasterization** — deferred to Stage 6 (cutover), or dropped entirely if raster is never added. Stage 5's Done-when ("the image endpoint returns a row-wrapped static export") is met by the `.svg` + `?preview=mural-static` surface. Whether `.png` ever emits PNG bytes vs. aliases the still SVG is not decided here.
- **Ribbon resolution fallback** — per-day is the target (Phase 2). If Phase 5's measurement shows per-day genuinely blows a real byte budget after floor+RLE, drop to per-ISO-week as a **recorded compromise** in Phase 2/5, not a silent redefinition of "exact."

## Done when

The image endpoint returns a row-wrapped static export for any handle and world behind `?preview=mural-static`, showing the exact activity chart (per-day, conservation-checked), matching the animated epic's story and badges (parity by construction), with no motion; it renders complete and grace-floored across desert/river/mountain and down to a single commit; re-rendering the same `(snapshot, world)` yields identical bytes; the default embed and every earlier golden are untouched.
