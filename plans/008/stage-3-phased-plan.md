# Stage 3 phased plan — motion: dwell-and-zip camera

Phased implementation plan for [Stage 3 of the visual-system staged plan](stages.md#stage-3--motion-dwell-and-zip-camera): the static desert mural becomes the flagship animated experience. On load a camera drifts slowly across each dwelled era and zips (a fast eased whip, never a cut) to the next; per-era intro beats fire on the dwell; depth layers parallax during travel; the replay freezes on the present-day badge finale, then hands off to perpetual ambient micro-loops. Still one world (desert), still behind `?preview=mural`. The live cosmic embed and every Stage-1/2 static golden stay byte-identical.

## Goal

Turn the existing static full-strip mural into a baked, self-contained SMIL animation bounded to ~12–18s, ending frozen on the present-day dwell, then living forever in a subtle ambient loop — deterministic (same data → identical bytes), embed-safe (no script, no external refs), and inside a GitHub-safe file budget. No JavaScript. No new world. The static renderer is untouched so its goldens and the Stage-5 still path survive.

## Context

Stage 1 delivered `buildMuralScene` (`build-mural-scene.ts`) → a pure `MuralScene` (contiguous `PlacedEra[]` with `x`/`width`/`slots`/`ribbon`/`title`, plus `subtitle`, `badges`, accessible text), and `renderMuralSvg` (`render-mural-svg.ts`) which draws it as ONE full-strip SVG: `viewBox="0 0 scene.width scene.height"`, all layers flat siblings in absolute strip coords — `renderSky`, `renderTerrain`, `renderRoad`, `renderStructures`, `renderMotifs`, `renderRibbon`, `renderText`, `renderBadgeFinale`. Stage 2 added the motif and badge layers. `renderMural` (`render-mural.ts:8`) is the sole non-test caller of `renderMuralSvg` and is exactly the `?preview=mural` surface (`route-service-request.ts:46` → `handle-image-request.ts:51`). Precedent: the cosmic `starfield.ts` already ships `<animate>`, so SMIL is a proven embed-safe primitive here; `expectEmbedSafeSvg` bans only `<script`, `@import`, `on*=`, and `http(s)` refs — `<animate>`/`<animateTransform>` pass.

Real era counts are bounded: chapters are capped at `MAX_CHAPTERS = 8` (`order-chapters.ts:4`) and `partitionEras` appends exactly one present-day era (`partition-eras.ts:50`), so `scene.eras.length ∈ [1, 9]`. `partitionEras` also has a sole-era grace-floor case for no-activity accounts (`partition-eras.ts:21`). Era base widths (`era-widths.ts`) × world-scale factor land each era ≈ 136–253px, so a ~640px camera window frames ~3–4 eras at once.

Stage 3 is additive: a new pure camera-track model, a new animated renderer that **re-wraps the existing `render*` fragments** into depth `<g>` groups (never reimplements them), four byte-preserving refactors to make that composition possible, and a repoint of `renderMural`. The static `renderMuralSvg` and every Stage-1/2 unit golden stay byte-identical.

## Guiding constraints (from the visual spec and staged plan)

- **Determinism.** Same `(data, world)` → identical bytes. The camera track is a pure function of the placed eras and strip width; every emitted time/coordinate goes through `formatSvgNumber`. No seed, no clock.
- **Self-contained baked animation.** All motion is SMIL in the SVG; nothing server-driven; JavaScript never required. Replay plays **once per load** (`fill="freeze"`, no `repeatCount` on the pan), then rests.
- **Embed-safe.** Animated output passes `expectEmbedSafeSvg`. SMIL only; no `<script>`, no `<style>` media queries, no external refs.
- **Grace floor.** Sub-window strips (camp / single-commit) degrade to a static centered hold — a complete scene, never a broken pan.
- **Bounded file.** A separate `MURAL_ANIMATED_BYTE_CEILING`, measured against the worst-case dense animated render, keeps the file GitHub-safe. The static `MURAL_BYTE_CEILING` is unchanged.
- **Static untouched.** `renderMuralSvg` and all Stage-1/2 goldens stay byte-identical. The four refactors are byte-preserving, each guarded by those goldens staying green **before** the animated renderer exists.
- **TDD.** Red test first every phase (`CLAUDE.md`).

## Architecture at a glance

- **Camera model** (`build-camera.ts`, pure): `buildCameraTrack(eras: PlacedEra[], sceneWidth): CameraTrack`, where
  `CameraTrack = { track: { keyTimes: number[]; keySplines: string[]; values: number[]; totalSeconds: number }; eraTimings: { dwelled: boolean; dwellStartSeconds: number }[] }`.
  `eraTimings` is index-aligned to `eras`. `values` are foreground (rate 1.0) `translateX` stops; slower planes scale these by their rate.
- **Camera-x** (centered, clamped): `translateX(t) = -(cameraX(t) − W/2)`, `cameraX ∈ [W/2, sceneWidth − W/2]`, `W = CAMERA_WINDOW_WIDTH`. Sub-window (`sceneWidth ≤ W`): static `translateX = (W − sceneWidth)/2`, no pan, single dwell.
- **Depth planes (B′):** BACK = `renderSky` at rate 0 (window-pinned full-window gradient); MID = `renderDistantBand` only at rate ~0.4 with trailing bleed `(1−rate)·maxPanSpan`; FRONT = `renderEraGround` + `renderRoad` + per-era `{structures, motifs, title}` + `renderRibbon` at rate 1.0 (everything spatially coupled to the road shares 1.0). HUD = topmost rate-0 group (`renderSubtitle` + badge finale). `maxPanSpan = max(0, sceneWidth − W)`.
- **Animated renderer** (`render-animated-mural-svg.ts`): composes the planes, stamps the pan `animateTransform`s from the track, the per-era beats from `eraTimings`, the finale fade, and the rest-window ambient loops.

## Phases

## Phase 1 — Byte-preserving composition refactors

Make the existing layers composable per-plane and per-era without changing any static bytes. No animation yet. Each refactor is its own commit; the Stage-1/2 goldens (`render-mural-svg.test.ts` and the layer goldens) stay green throughout, so any byte drift is attributable.

- **Split `renderTerrain` → `renderDistantBand` + `renderEraGround`** (`layers/terrain.ts`). `distantBand` (horizon rect, `skyBottom→horizonBottom`, pure backdrop) and `eraGround` (per-era ground tint `horizonBottom→roadBaseline`, road-coupled) become two exported functions. `renderTerrain` stays as a thin `distantBand + eraGround` concat in the same order so `renderMuralSvg` bytes are identical.
- **Extract `renderSubtitle`** (`layers/text.ts`). Lift the subtitle emitter (`text.ts:17,23`, x=24 / `SUBTITLE_Y=28`) into `renderSubtitle(scene)`. `renderText` becomes `renderSubtitle + <per-era titles>` in the exact prior order; coordinates unchanged. Static bytes identical.
- **Expose per-era accessors.** `renderEraStructures(era, worldScale)` and `renderEraMotifs(era, worldScale)` (the internals already loop per era at `structures.ts:22`, `motifs.ts`), and `eraTitleText(era)` (already `text.ts:31`, just not exported). `renderStructures`/`renderMotifs`/`renderText` re-expressed as `eras.map(accessor).join('')` — byte-identical.
- **Add `anchorWidth` to `renderBadgeFinale`** (`layers/badge-finale.ts`). `renderBadgeFinale(scene, { anchorWidth = scene.width } = {})`; replace the three `scene.width` sites (`:29`, `:30`, `:32`) with `anchorWidth`. Default keeps the static golden byte-identical.

**Test cases.** All existing static goldens (`render-mural-svg.test.ts`, `terrain.test.ts`, `text.test.ts`, `badge-finale.test.ts`, `structures.test.ts`, `motifs.test.ts`) stay byte-identical (they are the guard — no new assertions needed beyond keeping them green). Add: `renderTerrain` deep-equals `renderDistantBand + renderEraGround`; `renderBadgeFinale(scene)` equals `renderBadgeFinale(scene, { anchorWidth: scene.width })`; each new per-era accessor output is a substring of its all-eras layer output.

**Commit plan.**
1. `refactor: split terrain into distant band and era ground`
2. `refactor: extract subtitle emitter from text layer`
3. `refactor: expose per-era structure, motif, and title accessors`
4. `refactor: parameterize badge finale anchor width`

## Phase 2 — Camera geometry constants and track types

Foundations with no behavior. Prerequisite for the pure model and the renderer.

- **`mural-vocabulary.ts`** — add `CAMERA_WINDOW_WIDTH` (~640 default; calibration set/confirmed in impl against the finale width per D3) as a sibling top-level constant alongside `MURAL_HEIGHT`/`Y_BANDS`. `MURAL_HEIGHT`, `Y_BANDS`, `MURAL_PALETTE`, `MURAL_BYTE_CEILING` stay byte-identical. `MURAL_ANIMATED_BYTE_CEILING` is added in Phase 8 once measured.
- **`camera-track.ts`** (types + shared timing constants) — `CameraTrack` type as above, plus named timing constants: `TOTAL_REPLAY_SECONDS` (~15), `REPLAY_MIN_SECONDS` (12), `REPLAY_MAX_SECONDS` (18), `MIN_DWELL_SECONDS` (~1.4), `MAX_DWELLED_ERAS` (~6), `ZIP_SECONDS` (small constant), `BEAT_SETTLE_SECONDS` (~0.15), `PLANE_RATE = { sky: 0, distantBand: 0.4, front: 1 }`. All impl-time calibration defaults, not architecture.

**Test cases.** Type-level only; covered by Phase 3's red test (first behavioral use). Optional trivial construction guard.

**Commit plan.**
1. `feat: add camera window width and track types`

## Phase 3 — Camera track model (`build-camera.ts`)

The pure pass. No SVG. Deterministic. Break out sub-functions (dwell-weight-by-kind, era selection, normalization) as they grow, per `CLAUDE.md`.

- **`buildCameraTrack(eras: PlacedEra[], sceneWidth): CameraTrack`.**
  - **Camera-x stops** = each era center `x + width/2`, clamped to `[W/2, sceneWidth − W/2]`.
  - **Dwell weight by `chapter.kind` (D6):** booms (`prolificacy`, `great-streak`, `flagship-rise`, `star-milestone`) heavy; `origin`, `language-era` light; `dark-age` long-dwell / near-zero drift (lonely hold over its wide stretch); the trailing present-day (`chapter === null`, `tier === 'modern'`, always last) is the heaviest dwell and the freeze destination — no trailing zip after it.
  - **Selection (D7):** present-day always dwelled; fill remaining slots up to `MAX_DWELLED_ERAS` by dwell-weight desc, tie-break by **recency** (later left-to-right index wins) so the last big beat before the finale survives. Non-selected eras are zipped through (rendered, no dwell, no beat). `log()` which eras were zipped when the cap binds (no silent truncation).
  - **Segments:** for each dwelled era, a DWELL (small camera-x drift across the era so it is not a dead hold) then, unless it is present-day, a ZIP (`ZIP_SECONDS`) to the next dwelled stop; zipped-through eras are absorbed into the adjacent zip span.
  - **Normalization:** scale dwell+zip durations to land `totalSeconds` in `[REPLAY_MIN, REPLAY_MAX]` targeting `TOTAL_REPLAY_SECONDS`, each dwell ≥ `MIN_DWELL_SECONDS`. Because the count is capped, floor and ceiling never contradict (D7). **Low-count under-pad:** when `dwelledCount ≤ 2`, allow `totalSeconds < REPLAY_MIN` rather than pad a near-static hold.
  - **Sub-window branch (D4):** `sceneWidth ≤ W` → single stop, `totalSeconds` minimal, one dwelled era, no pan.
  - **Output:** `track.values` = foreground translateX stops; `keyTimes` in `[0,1]` from the cumulative normalized durations; `keySplines` = near-linear for dwell segments, ease-in-out for zips; `eraTimings[i] = { dwelled, dwellStartSeconds = dwellStartKeyTime × totalSeconds }`, index-aligned to `eras`.

**Test cases.** Rich 9-era metropolis: ≤6 dwelled, present-day dwelled, `totalSeconds ∈ [12,18]`, zipped eras logged, `eraTimings` length = era count. Boom tie-break: among equal-weight booms the later index is kept, the earlier zipped. Dark-age: dwelled with near-zero drift delta. Sub-window (single-era camp): one stop, no pan, `translateX` centered. Low-count (2 eras): `totalSeconds` allowed below 12. `keyTimes` monotonic in `[0,1]`, `values`/`keyTimes`/`keySplines` length-consistent. Present-day is the final stop with no trailing zip. Determinism: `buildCameraTrack` `toEqual` on re-run.

**Commit plan.**
1. `test: pin camera track selection, timing, and sub-window`
2. `feat: build the dwell-and-zip camera track`
3. (if it grows) `refactor: split dwell-weight and era selection`

## Phase 4 — Animated renderer: depth planes and the pan

The renderer skeleton — three parallax planes translated by the track. No beats, no ambient, no HUD yet (added in 5–7). Not yet wired into `renderMural`.

- **`render-animated-mural-svg.ts`** — `renderAnimatedMuralSvg(scene): string`. `viewBox="0 0 CAMERA_WINDOW_WIDTH MURAL_HEIGHT"`, `role="img"`, accessibility `<title>`/`<desc>` (reuse `renderAccessibility`). Build the track via `buildCameraTrack(scene.eras, scene.width)`. Compose:
  - BACK `<g>`: `renderSky` (window-width gradient), rate 0 — no translate.
  - MID `<g>`: `renderDistantBand` extended on the trailing edge by `(1 − 0.4)·maxPanSpan`, with an `animateTransform translate` whose `values` = `track.values × 0.4`, shared `keyTimes`/`keySplines`, `dur = totalSeconds`, `fill="freeze"`.
  - FRONT `<g>`: `renderEraGround` + `renderRoad` + `scene.eras.map(renderEraStructures/renderEraMotifs)` + `renderRibbon` + per-era titles, with `animateTransform translate` `values` = `track.values` (rate 1.0). Beats added in Phase 5.
  - Sub-window branch: emit the static centered translate (a single `transform`, no `animateTransform`).

**Test cases.** Output contains exactly three depth groups; FRONT `animateTransform` `values` match `track.values` and `keyTimes` match the track; MID `values` = front × 0.4; distant band extended by the bleed on a multi-era fixture; sky carries no translate. Sub-window fixture: no `animateTransform` on any plane, centered `transform`. `viewBox` = `0 0 CAMERA_WINDOW_WIDTH 360`. `expectEmbedSafeSvg` passes. Determinism: byte-identical re-render.

**Commit plan.**
1. `test: pin animated renderer planes and pan track`
2. `feat: render parallax planes with the baked pan`

## Phase 5 — Per-era intro beats

Content on dwelled eras rises and fades in as the camera settles; zipped eras are simply present and streak past.

- **`render-animated-mural-svg.ts`** — wrap each **dwelled** era's foreground `{ renderEraStructures, renderEraMotifs, eraTitleText }` in one `<g>` carrying two beats: `animate` opacity `0→1` and `animateTransform` `translate` `from="0 8" to="0 0"`, both `dur ≈ 0.5s`, `fill="freeze"`, `begin = eraTimings[i].dwellStartSeconds + BEAT_SETTLE_SECONDS` (absolute seconds via `formatSvgNumber`). Zipped eras render their foreground at opacity 1, no beat. The pan lives on the outer FRONT `<g>` (translateX); each inner era `<g>` carries its own translateY+opacity — transforms compose by nesting.

**Test cases.** A dwelled era's foreground group carries an opacity `0→1` beat with `begin` = its `dwellStartSeconds + settle`; a zipped era has no beat and opacity 1. Beat count = dwelled-era count × 2 ≤ 12. Nesting: beat `<g>` is inside the FRONT translate `<g>`. `begin` values are fixed (formatSvgNumber) and deterministic. `expectEmbedSafeSvg` passes.

**Commit plan.**
1. `test: pin per-era intro beats on dwelled eras`
2. `feat: fire per-era beats on the dwell`

## Phase 6 — HUD plane: subtitle and finale fade

The topmost window-pinned overlay: the persistent caption and the climax panel.

- **`render-animated-mural-svg.ts`** — a final rate-0 HUD `<g>`, emitted after the front plane (topmost), holding:
  - `renderSubtitle(scene)` at opacity 1 from `t=0` (coordinates unchanged — x=24 top-left is already window-relative once it stops panning).
  - `renderBadgeFinale(scene, { anchorWidth: CAMERA_WINDOW_WIDTH })` wrapped in a `<g>` with `animate` opacity `0→1`, `begin = eraTimings[last].dwellStartSeconds + BEAT_SETTLE_SECONDS`, `fill="freeze"`, hidden (opacity 0) before that. Present-day is the forced last dwell, so the finale settles exactly as the camera freezes — the money-shot.

**Test cases.** HUD group is last in document order and carries no translate. Subtitle present at opacity 1. Finale panel right-anchored to `CAMERA_WINDOW_WIDTH` (not `scene.width`), opacity-gated with `begin` = present-day `dwellStartSeconds + settle`. Finale y-band (`PANEL_TOP=84`, height 34) sits in the sky band, clear of structures. A narrow-window fixture: finale shrinks toward `MIN_FONT_SIZE`, stays inside the window. `expectEmbedSafeSvg` passes.

**Commit plan.**
1. `test: pin window-pinned HUD and gated finale`
2. `feat: pin subtitle and fade in the finale`

## Phase 7 — Ambient micro-loops

The perpetual living rest state, scoped to the trailing window the visitor sees after freeze.

- **`render-animated-mural-svg.ts`** — for objects whose x falls in the REST WINDOW `[sceneWidth − W, sceneWidth]`, add indefinite loops on the **inner** element (never the beat group): banner sway (`animateTransform rotate ±2°`, `dur ≈ 3s`), gold / crownGate / spike-standout glow (`animate` opacity `0.85↔1`, `dur ≈ 2.5s`), crowd bob (`animateTransform translate` `y 1–2px`). `repeatCount="indefinite"` from `t=0` (subtle during the short pan, alive at rest). When the rest window holds no motifs, degrade to a glow pulse on any in-window gold accents — animate what is there, never fabricate. Cap ambient-animated elements at ~8. Ambient lives in the animated path only — `renderMuralSvg` stays motion-free.

**Test cases.** Star-heavy fixture (spike/crownGate in a boom era near the tail): the in-window standout carries a glow loop; an off-window motif has no ambient. Follower-heavy: in-window crowd carries a bob loop. Ambient elements ≤ 8. Beat × ambient separation: beat on the era `<g>`, ambient on the inner motif element. A fixture whose rest window holds no motifs: only accent glow (or none), no crash. `renderMuralSvg` for the same scene contains no `animate`. `expectEmbedSafeSvg` passes. Determinism: byte-identical re-render.

**Commit plan.**
1. `test: pin rest-window ambient loops`
2. `feat: loop ambient motion in the rest window`

## Phase 8 — Repoint, byte ceiling, and the done-when suite

Wire the animated renderer into the preview surface, set the animated file budget, and prove the Stage-3 guarantees end-to-end.

- **`render-mural.ts`** — repoint `renderMural` to `renderAnimatedMuralSvg(buildMuralScene(...))`. This is a real user-visible change: land the `render-mural.test.ts` golden change **RED-first**, not a silent bump.
- **`mural-vocabulary.ts`** — add `MURAL_ANIMATED_BYTE_CEILING`, measured against the worst-case dense animated render (rich 9-era metropolis: 3 plane translates + ≤6 dwell beats + finale fade + ≤8 ambient loops), set just above the measured size with an honest comment and margin. The static `MURAL_BYTE_CEILING` is unchanged.
- **`index.ts` / export test** — export `renderAnimatedMuralSvg` / `buildCameraTrack` if the export test requires it.
- **Docs / sample** — capture a Stage-3 animated sample (mirroring the `docs: capture phase-N sample` commits), update the visual-system spec's superseded static-only notes if any.

**Test cases (the done-when suite).**
- **Plays once, freezes, rests:** the pan `animateTransform` has `fill="freeze"` and no `repeatCount`; ambient loops carry `repeatCount="indefinite"`; the final stop is the present-day center.
- **Bounded:** dense animated render stays under `MURAL_ANIMATED_BYTE_CEILING`; `totalSeconds ∈ [12,18]` for a multi-era history (below 12 allowed only for `dwelledCount ≤ 2`).
- **Dwell readable, zip smooth:** dwelled eras carry a beat and a near-linear drift; transitions use ease-in-out keySplines; zipped eras carry no beat.
- **Grace floor:** single-commit / sub-window account renders a complete centered still, no pan, no crash.
- **Embed-safe + determinism:** animated render through `expectEmbedSafeSvg` with an XML-hostile handle; byte-identical re-render on a dense fixture; `buildCameraTrack` `toEqual` idempotence.
- **Static non-regression:** cosmic embed, `renderMuralSvg`, and all Stage-1/2 unit goldens byte-identical (motion appears only via the repointed `renderMural`).

**Commit plan.**
1. `test: pin dwell-and-zip done-when suite`
2. `feat: serve the animated mural at the preview surface`
3. `chore: set the animated mural byte ceiling`
4. `docs: capture stage-3 animated sample`

## Named risks

- **File-size discipline.** SMIL time/keyframe strings plus per-era beats and ambient loops grow the file. The caps (`MAX_DWELLED_ERAS`, ≤2 beat animates/era, ≤8 ambient elements, 3 plane translates) bound the worst case; Phase 8 confirms the measured `MURAL_ANIMATED_BYTE_CEILING` stays GitHub-safe. The static ceiling already reserved explicit Stage-3 headroom (`mural-vocabulary.ts:96`).
- **Renderer support for absolute-time SMIL.** `begin="Xs"` off the shared `t=0` origin (not syncbase) is the portable choice for GitHub's rsvg/camo pipeline and Safari; the cosmic render already ships `<animate>` as precedent. Verified against a real embed during Phase 8, not asserted absolutely.
- **Cross-plane sync.** Shared `keyTimes`/`keySplines` across planes with per-plane `values` scaling keeps parallax in lock-step; a divergence would desync the ground from the road. The road-coupled layers are all pinned to rate 1.0 exactly to avoid this; only the two pure backdrops parallax.
- **Camera calibration.** `CAMERA_WINDOW_WIDTH`, `TOTAL_REPLAY_SECONDS`, `MIN_DWELL_SECONDS`, `MAX_DWELLED_ERAS`, and the beat/ambient durations are impl-time defaults tuned against real renders, not architecture. `CAMERA_WINDOW_WIDTH` is confirmed against the finale width (Phase 6) so the freeze frame never clips.

## Open questions

- **Reduced motion (revisit in Stage 5).** Stage 3 does not add `prefers-reduced-motion` handling: SMIL cannot be gated by a CSS media query, and the specified reduced-motion fallback is the Stage-5 motion-free static export. The animated SVG's frozen final frame (`fill="freeze"`) is a valid still in the interim. Resolve when the static export lands.
- **Subtitle window-pin.** The subtitle moves from the panning front plane into the rate-0 HUD (Phase 6). Direction is decided (HUD-pinned, coordinates unchanged), but it is a tracked composition change, not a silent assumption — flagged here so a reviewer sees it.

## Out of scope

- River and mountain worlds (Stage 4).
- The row-wrapped static image export (Stage 5) — the animated file carries no static-export layout.
- Flipping the live default off the cosmic render (Stage 6).
- Any new world/motif vocabulary; desert maps the spec's cross-world ambient list (water/torches) to what desert has (sway/glow/bob), not new assets.
