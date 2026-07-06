# Stage 4 phased plan — the other two worlds

Phased implementation plan for [Stage 4 of the visual-system staged plan](stages.md#stage-4--the-other-two-worlds): river and mountain join desert, each with its own ancient→classical→modern material vocabulary, and a `world` URL parameter selects among them (defaulting to a hash of the handle). Still behind `?preview=mural`. The desert mural, the cosmic embed, and every Stage-1/2/3 golden stay byte-identical.

## Goal

Turn the single hard-coded desert render into a three-world render selectable by URL. Introduce a `World` value type that bundles everything currently desert-specific (palette, per-tier materials, spine, language accents, the two per-world signature silhouettes), refactor desert into a `worlds` catalog byte-identically, then add river and mountain as mechanical repetitions of the same pipeline. The world family is pure taste: it never encodes anything about the user — same data reads the same in every world. Deterministic (`identical (data, world) → identical bytes`), embed-safe, inside the same GitHub-safe file budget.

## Context

Stage 1 delivered `buildMuralScene` (`build-mural-scene.ts`) → a pure `MuralScene` and the static `renderMuralSvg` (`render-mural-svg.ts`). Stage 3 added `renderAnimatedMuralSvg` (`render-animated-mural-svg.ts`) and repointed `renderMural` (`render-mural.ts:8`) to it; `renderMuralSvg` is now test-only and the Stage-5 static-export basis. Both renderers compose the same per-layer `render*` fragments: `renderSky`, `renderTerrain`/`renderDistantBand`+`renderEraGround`, `renderRoad`, `renderStructures`/`renderEraStructures`, `renderMotifs`/`renderMotif`, `renderRibbon`, `renderText`/`renderSubtitle`+`eraTitleText`, `renderBadgeFinale`, `renderAccessibility`.

Every desert-specific value lives as a module-level literal in `mural-vocabulary.ts` (`MURAL_PALETTE`, `SKY_GRADIENT_STOPS`, `GROUND_TINT`, `STRUCTURE_FILL`, `RIBBON_RAMP`, `GOLD_ACCENT`, `LANGUAGE_ACCENT`) imported directly by the ~7 world-touching layers. The `modules/*` primitives already take a `ModuleFill` param and are world-agnostic — the only color they import is `MURAL_OUTLINE` (`outlined-shape.ts:2`). `MuralScene` carries data-derived `worldScale` (camp/town/metropolis) but no world *family*; motif `kind` is assigned in the pure builder (`place-motifs.ts`), never at render.

The service surface: `route-service-request.ts:45` `parseVariant` reads `?preview=mural`; `handle-image-request.ts` renders via `renderMural` and caches under `${handleKey}:mural` (`:33`). The hash util is `deriveSeedFromHandle` (FNV-1a 32-bit, `>>> 0`). Fixtures live in `test-fixtures/` (`brand-new-account`, `single-contribution-account`, `fifteen-year-overflow`, `rich-history-account`, `mohasarc-captured`, …); the done-when suite is `render-mural.done-when.test.ts`, whose byte-ceiling assertions render through `renderMural`.

Stage 4 is a byte-preserving refactor (desert into a catalog, `world` threaded through the shared layers) followed by two additive world phases and a cross-world done-when phase.

## Guiding constraints (from the visual spec and staged plan)

- **World is render-input, not scene geometry.** `buildMuralScene` stays world-blind and pure; `worldScale` (scale) is orthogonal to world family. World enters at render, threaded from the service.
- **World is pure taste (§5, §8.5).** It never signals newness, size, or strength. All six motif silhouettes are **shared** across worlds and recolored only — forking a motif shape by world would leak world into strength legibility and is forbidden. Same for classical/modern buildings (§3.1: same data → same landmark *types*).
- **Spine is the one spec-forced per-world geometry (§6.1).** A single continuous **road or river** threads the width; river draws water, desert/mountain draw a road. The river spine keeps `Y_BANDS.roadBaseline` as the ribbon-top edge — ribbon geometry stays world-independent.
- **Materials come from the world (§6.2).** desert mudbrick→glass; river harbor→port; mountain stone→terraced — expressed through per-tier palette, not new silhouettes.
- **Determinism.** `identical (data, world) → identical bytes`. `WORLD_NAMES` order is a frozen, append-only-never-reorder contract (the hash default depends on it).
- **Grace floor holds in every world.** Every account down to one commit renders a complete scene in desert, river, and mountain.
- **Bounded file.** The two shared byte ceilings (static + animated) stay one GitHub-safe budget; recalibrated to the honest max across worlds, then a tight guard catches future bloat.
- **TDD.** Red test first every phase (`CLAUDE.md`).

## Architecture at a glance

- **`World` bundle** (new, in a `worlds` module): per-world values only —
  `{ name, sky: SkyStops, distantTerrain, groundTint: Record<tier,color>, structureFill: Record<tier,ModuleFill>, spine: { kind: 'road'|'river', color }, ribbonRamp: string[], goldAccent, languageAccent: Record<string,string>, languageAccentFallback, modules: { camp, prop } }`.
  `modules.camp`/`modules.prop` are module-drawing functions (the world's ancient-opener and its signature prop). Kind→shape for the six motifs stays shared; the world supplies only palette to them.
- **Shared, world-independent** (stays in `mural-vocabulary.ts`): `MURAL_HEIGHT`, `Y_BANDS`, `CAMERA_WINDOW_WIDTH`, `MODULE_PATH_BUDGET`, `MURAL_OUTLINE`(+width), `SEAM_FEATHER_WIDTH`, `RIBBON_PITCH`, `STRUCTURE_HEIGHT`, `MARKER_HEIGHT`, the two byte ceilings, typography.
- **`worlds` catalog**: `WORLD_NAMES = ['desert', 'river', 'mountain']` (frozen order); `worlds: Record<WorldName, World>`. `resolveWorldName(param: string | null, handle: string): WorldName` — strict lowercase-exact match of the 3-set, else `WORLD_NAMES[deriveSeedFromHandle(handle) % 3]`.
- **Threading**: `world` is passed as an explicit param **beside `worldScale`** through both renderers and the world-touching layers (mirrors how `worldScale` already threads: `renderEraStructures(era, worldScale)` → `renderEraStructures(era, worldScale, world)`). Modules stay `ModuleFill`-taking primitives.
- **Selection/service**: the route layer extracts the raw `?world` string; `handleImageRequest` resolves it via `resolveWorldName` on the normalized `handleKey`, uses the resolved name in **both** the cache key (`${handleKey}:mural:${worldName}`) and the render call. Resolution only on the mural path; the cosmic path and its key are untouched.
- **Public entry**: `renderMural(snapshot, world: WorldName = 'desert')` looks up `worlds[world]` and threads the `World` down. `renderMuralSvg(scene, world = 'desert')` gains the param too (forced by the shared-layer refactor); its static endpoint/row-wrap remains Stage 5.

## Phases

## Phase 1 — World abstraction and byte-preserving desert refactor

Introduce the `World` type, the `worlds` catalog, and `WORLD_NAMES`; move the desert literals into `worlds.desert`; thread `world` through every world-touching layer and both renderers. Pure refactor — desert output and every existing golden stay byte-identical. No new world behavior.

- **`worlds` module** (`src/mural/worlds/`): the `World` type; `WorldName = 'desert' | 'river' | 'mountain'`; `WORLD_NAMES` frozen `['desert','river','mountain']`; `worlds` catalog. `worlds.desert` holds the exact current desert literals moved verbatim from `mural-vocabulary.ts`. **`worlds.river` and `worlds.mountain` are aliased to the desert `World` in P1** — explicit named placeholders overwritten by the real worlds in P3/P4, *not* a runtime `?? desert` fallback. This freezes `WORLD_NAMES` order and the `% 3` modulus from the first phase and guarantees every resolvable name hits a real catalog entry.
- **Move vs keep in `mural-vocabulary.ts`.** Move into `worlds.desert`: `MURAL_PALETTE` (its per-world members: `sky*`, `horizon`, `distantTerrain`, `road`, `structure*`), `SKY_GRADIENT_STOPS`, `GROUND_TINT`, `STRUCTURE_FILL`, `RIBBON_RAMP`, `GOLD_ACCENT`, `LANGUAGE_ACCENT`. Keep shared: all constants listed under *Architecture → Shared* above.
- **Thread `world` through the layers.** Each of `sky`, `terrain`, `road`, `structures`, `ribbon`, `motifs`, and the badge-finale palette gains a `world: World` param and reads its colors from `world` instead of the module-level desert import. `renderRoad` dispatches on `world.spine.kind` (in P1 both branches are the desert road; the river branch is a stub returning the road, filled in P3). `renderStructures`/`renderEraStructures` pick the camp module from `world.modules.camp`; props from `world.modules.prop`.
- **Thread through both renderers.** `renderMural(snapshot, world: WorldName = 'desert')` does the single `worlds[world]` catalog lookup and passes the resolved `World` object down to `renderAnimatedMuralSvg(scene, world)` (and `renderMuralSvg(scene, world)` for the static path). Both renderer params default to the desert `World` so every existing call site (tests, done-when) stays byte-identical.
- **Exports.** Export `WorldName`, `WORLD_NAMES`, `resolveWorldName` (added P2), and the `renderMural` signature change through `index.ts` as the export test requires.

**Test cases.** Every existing static + animated golden stays byte-identical — they are the guard (`render-mural-svg.test.ts`, `render-animated-mural-svg.test.ts`, the layer goldens, `render-mural.done-when.test.ts`). Add: `worlds.desert` deep-equals the pre-refactor desert constants; `renderMural(snapshot)` equals `renderMural(snapshot, 'desert')`; in P1 `renderMural(snapshot, 'river')` and `renderMural(snapshot, 'mountain')` equal the desert bytes (alias); each world-touching layer given `worlds.desert` emits its exact prior output. `WORLD_NAMES` is length 3 and order `['desert','river','mountain']`.

**Commit plan.**
1. `refactor: extract the world bundle and desert catalog entry`
2. `refactor: thread the world through the mural layers`
3. `refactor: thread the world through both renderers`

## Phase 2 — World selection and service wiring

Resolve the `world` parameter and wire it end to end. Output is still desert for every request (river/mountain resolve to their P1 aliases), so this phase changes plumbing, not pixels.

- **`resolveWorldName(param, handle)`** in the `worlds` module: strict lowercase-exact match against `WORLD_NAMES`; anything else (wrong case, empty, absent, unknown) → `WORLD_NAMES[deriveSeedFromHandle(handle) % 3]`. Uses the same normalized handle the cache key uses.
- **Route layer** (`route-service-request.ts`): extract the raw `?world` query string beside `parseVariant`; pass it down as a new `requestedWorld: string | null` arg. No resolution here (no normalized handle yet).
- **`handleImageRequest`** gains a 4th defaulted param `requestedWorld: string | null = null` (mirroring how `variant` was added as a defaulted 3rd). On the mural path only: `const worldName = resolveWorldName(requestedWorld, handleKey)`; cache key becomes `${handleKey}:mural:${worldName}`; render call is `renderMural(snapshot, worldName)`. Cosmic path and its `${handleKey}` key untouched.

**Test cases.** `resolveWorldName`: `'desert'|'river'|'mountain'` → themselves; `'River'`, `'DESERT'`, `''`, `null`, `'ocean'` → the hash-default; hash-default is deterministic per handle and stable across calls; normalized vs raw-cased handle (`Mohasarc` vs `mohasarc`) → same world. Route: `?world=river` extracts `'river'`; absent → `null`; `?preview=mural&world=mountain` extracts both. `handleImageRequest`: mural request caches under `:mural:<name>`; two different worlds for one handle produce two cache entries and never serve each other's body; cosmic request key unchanged. Determinism of the resolver on re-run.

**Commit plan.**
1. `test: pin world resolution and per-world cache keys`
2. `feat: resolve the world param and key the mural cache by world`

## Phase 3 — River world

Overwrite `worlds.river` with the real river bundle. Carries the stage's novel geometry (the water spine + its ambient flow), so it lands before mountain.

- **Palette** (authored literals, per the *material constraint*, not enumerated here): cool blue-green, harbor→port progression, keeping desert's warmth-*of-progression* feel — per-tier ground tint and structure fill, sky stops, distant terrain, ribbon ramp, gold accent.
- **Language accents**: river's own literal `LANGUAGE_ACCENT` map (same 16 keys, each hue pulled toward the river palette) + its own neutral fallback. The dominant-language banner still flies throughout (§8.4) — same shape, river-tinted.
- **Spine** (`layers/road.ts`, river branch): a continuous water band at `Y_BANDS.roadBaseline` (ribbon-top edge preserved) instead of the polyline road, plus a **world-level flow ambient loop** — a new persistent gesture owned by the spine layer, sibling to the motif `sway/glow/bob` set in `render-animated-mural-svg.ts`, not routed through `ambientMotion`. Water that doesn't move reads broken, so the flow loop is required, not optional.
- **Signature silhouettes**: `worlds.river.modules.camp` = a river dock-hut (the ancient opener); `worlds.river.modules.prop` = a boat (§6.1's world-flavor props). Each a small new module file under `MODULE_PATH_BUDGET`. Classical/modern buildings remain the shared `structure` module recolored — harbors/arches are river's *material flavor*, not new modules.
- **Byte ceiling**: measure the river worst case (`fifteen-year-overflow` in river, static + animated). If it exceeds a shared cap, recalibrate **both** `MURAL_BYTE_CEILING` and `MURAL_ANIMATED_BYTE_CEILING` to the new max + the same tight guard, in this phase, with a comment naming the measurement, fixture, and that river set it (matching the existing calibration-comment discipline — not a round bump).
- **Sample legibility watch-item** (non-blocking, from the design review): title/plaque text color stays shared dark. When authoring the river sample, check contrast on the cooler palette; if it reads low, add a per-world text color to the palette map (a palette addition caught by the sample step — no structural or phase change).

**Test cases.** River render is byte-different from desert for a dense fixture (world actually applies). Spine: river output draws the water band at `roadBaseline` and carries the flow ambient loop; desert/mountain do not. Grace floor: `single-contribution-account` in river renders a **complete continuous water spine at `roadBaseline` with the ribbon-top edge intact** (the riskiest new geometry) — a valid, non-broken scene. Determinism: `fifteen-year-overflow` in river is byte-identical on re-render. Byte ceiling: river `fifteen-year-overflow` (static + animated) is within the (possibly recalibrated) caps. `expectEmbedSafeSvg` passes for river. Captured `mohasarc-captured` river sample pins bytes.

**Commit plan.**
1. `test: pin the river world spine, grace floor, and bytes`
2. `feat: add the river world with a flowing water spine`
3. `docs: capture the stage-4 river sample`
4. (if the cap moved) `chore: recalibrate the mural byte ceilings for river`

## Phase 4 — Mountain world

Overwrite `worlds.mountain`. Mechanical repetition of P3 minus the spine risk — mountain's spine is a recolored road.

- **Palette**: cool grey-green, stone→terraced progression, keeping the warmth-of-progression feel. Per-tier ground/structure fills, sky, distant terrain, ribbon ramp, gold accent.
- **Language accents**: mountain's own literal map + neutral fallback (hues pulled toward the mountain palette).
- **Spine**: `spine.kind = 'road'`, recolored — reuses the desert road branch, no new geometry, no new ambient.
- **Signature silhouettes**: `modules.camp` = a stone cairn (ancient opener); `modules.prop` = a pine. Small new module files under budget. Classical/modern = shared `structure` recolored.
- **Byte ceiling**: conditional recalibration — mountain has no water band and small modules, so its worst case likely sits under river's cap (expected no-op). Recalibrate only if mountain becomes the new max, with the same documented basis.
- **Sample legibility watch-item**: same text-contrast check as P3 when authoring the mountain sample.

**Test cases.** Mountain render is byte-different from desert and from river for a dense fixture. Grace floor: `single-contribution-account` in mountain renders complete, with the **cairn camp module** drawn (mountain's untested new silhouette). Mountain spine is the road treatment (no water band, no flow loop). Determinism: `fifteen-year-overflow` in mountain byte-identical on re-render. Byte ceiling within caps (static + animated). `expectEmbedSafeSvg` passes. Captured `mohasarc-captured` mountain sample pins bytes.

**Commit plan.**
1. `test: pin the mountain world grace floor and bytes`
2. `feat: add the mountain world`
3. `docs: capture the stage-4 mountain sample`

## Phase 5 — Cross-world done-when and docs

The Stage-4 done-when as one pinned suite, plus the doc/example update.

- **Done-when suite** (`render-mural.done-when.test.ts` additions, mapping stages.md:126): for each of the three worlds — renders a complete animated epic for any handle (`brand-new`, `single-contribution`, `rich-history`), stays deterministic (byte-identical re-render), and holds the grace floor (river water spine + mountain cairn named explicitly). Plus: `?world` picks the requested world; an absent/invalid value hash-defaults deterministically (through the service, thin — the depth lives in the P2 resolver unit test, not repeated across fixtures × worlds here).
- **Verification matrix** the suite realizes (scoped, no full cartesian): byte ceiling on `fifteen-year-overflow` × 3 (static + animated); determinism on `fifteen-year-overflow` × 3; grace on `single-contribution` + `brand-new` × 3; hash/invalid via the resolver unit test; captured `mohasarc-captured` × 3 sample commits (from P3/P4).
- **Docs/examples**: README updated to the three-world system and the `?world=desert|river|mountain` parameter (with the hash default and the "world is taste, not a signal" note). `examples/stage-4-*/` carries the three captured samples with a short `README.md` describing input → output per world. Update the 008 functional-spec cross-references only if a stated behavior changed (it did not — this stage delivers what §5/§6.2/§8.5 already specify).

**Test cases.** The done-when suite above, all green. Example/doc presence is verified by the sample commits from P3/P4; the README change is prose.

**Commit plan.**
1. `test: pin the stage-4 three-world done-when suite`
2. `docs: document the world parameter and three-world system`

## Open questions

None. Every load-bearing decision was resolved in design. One non-blocking watch-item is recorded inline in P3/P4: shared dark title/plaque text may read low-contrast on the cooler river/mountain palettes; the fix (a per-world text color in the palette map) is caught by the captured-sample step and needs no structural or phase change.
