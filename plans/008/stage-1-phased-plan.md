# Stage 1 phased plan — mural foundation: one world, static, complete

Phased implementation plan for [Stage 1 of the visual-system staged plan](stages.md#stage-1--mural-foundation-one-world-static-complete): a new **static** desert-world mural renderer that turns any handle into one continuous illustrated strip — a single unbroken road, temporal eras placed as stretches, the contribution ribbon along the bottom, terse title/subtitle/label text — reachable behind a preview surface, complete and grace-floored for every account. No animation (Stage 3), no dimension motifs or badge finale (Stage 2), no river/mountain worlds (Stage 4), no row-wrapped export (Stage 5). The live default embed stays the cosmic render, byte-identical.

## Goal

After all phases: a pure `renderMural(snapshot): string` (entry `src/render-mural.ts`, internals `src/mural/`) produces one flat-vector desert mural SVG — sky/terrain/continuous-road/structures/ribbon/text in fixed Y-bands, width summed from data, deterministic bytes. It is reached via `/<handle>.svg?preview=mural` and a `pnpm render-mural` CLI. The cosmic `src/rendering/` path and `renderEpic` are untouched; the bare `/<handle>.svg` response stays byte-identical. Generation is deterministic (no clock, no `Math.random`; seed only breaks cosmetic ties) and LLM-free.

## Context

The cosmic render path is the template for structure, not for look. `renderEpic` (`src/render-epic.ts:7`) runs `detectChapters` + `narrateChapter`, hands them to `buildTimeline(snapshot, narratedChapters): Timeline` (`src/timeline/build-timeline.ts:15`), then `renderEpicSvg(timeline): string` (`src/rendering/render-epic-svg.ts:36`). `Timeline` is the typed IR (`src/timeline/timeline.ts:38`); text is baked into the IR as data (`narration` on each segment, `build-timeline.ts:38` → emitted at `render-epic-svg.ts:93`). The mural mirrors this split exactly: `buildMuralScene → MuralScene → renderMuralSvg`.

Data available this stage: `HistorySnapshot` (`src/history-snapshot.ts`) carries `contributionDays` (ascending, ≥1-count days only), `repositories`, `followerCount`, `pullRequestsOpenedCount`/`issuesOpenedCount` (nullable), `accountCreatedDate`, `firstPublicActivityDate` (`null` for zero-activity), `capturedAtDate`. `scoreStrengths(snapshot): StrengthsResult` (`src/strengths/score-strengths.ts`) ranks eight dimensions by continuous `reach ∈ [0,1]`, excludes unavailable (null) dimensions from `ranked`, and derives `dominantLanguage`. Stage 0 shipped **no** composite scale — Stage 1 derives it from `ranked` reach.

Chapters (`src/chapters/chapter.ts`) do not tile the timeline by date: `origin` (`date | null`), `flagship-rise`/`star-milestone`/`language-era` are point (single `date`), `dark-age`/`great-streak` carry `date`+`endDate`+`lengthDays`, `prolificacy` is a year. The mural synthesizes a contiguous date **partition** from them so the ribbon is honest.

Reusable primitives: `formatSvgNumber` (`src/rendering/format-svg-number.ts`), `escapeXmlText` (`src/rendering/escape-xml-text.ts`), `createSeededRandom` (`src/rendering/seeded-random.ts`), `deriveSeedFromHandle` (`src/timeline/derive-seed-from-handle.ts`), `expectEmbedSafeSvg` (`src/test-support/expect-embed-safe-svg.ts`), `buildHistorySnapshot` (`src/test-support/build-history-snapshot.ts`). The cosmic `src/rendering/visual-vocabulary.ts` is **not** reused — the mural gets its own warm-palette, system-sans vocabulary.

Determinism is the invariant: same `snapshot` → identical mural bytes. Randomness stays seeded and cosmetic-only (§3.1) — it never changes structure count, era width, tier, or meaningful position.

## Guiding constraints (from the visual spec)

- **Style contract (§6.9):** flat vector, thin dark outline, warm limited palette, flat fills, silhouette figures, gradients **only in the sky**, compact digit plaques, no raster, no external fonts. Hard per-module path budget.
- **Grace floor (§3.4) + no-override (§3.3):** every account renders a complete composed scene; small = small-but-hopeful (camp/dawn), never decayed; decay is produced **only** by the `dark-age` chapter.
- **Honest ribbon (§6.6):** real per-day activity under each era, never curated away.
- **Text never gates a render (§6.7):** every era has a safe-default title; an uncovered case renders a plain subtitle, never empty, never a crash.

## Phases

## Phase 1 — Mural vocabulary and module primitives

**Behavior delivered.** A new `src/mural/mural-vocabulary.ts` holds the desert style system: warm palette, sky-gradient stops (the only gradient), per-tier ground tints (ancient/classical/modern), the thin-dark-outline color constant, structure fills, system-sans typography, canvas constants (`MURAL_HEIGHT`, Y-band edges, seam-feather width). A set of pure **module** functions each render one reusable object (`structure`, `marker`, `prop`, `tent`) in a **normalized local box** (origin `0,0`), placement-agnostic, recolored via **fill params** (outline is a fixed constant, not a param). Callers wrap a module in `translate()/scale()`. Nothing composes a scene yet; the cosmic path is untouched.

**Test cases.**
- Each module renders valid SVG in its normalized box, emits no absolute canvas coordinates (no `CENTER_X`-style globals), and hardcodes no fill (fill comes from the param). Level: unit.
- Recoloring a module with two different fill params changes only the fill, not geometry (byte-diff limited to color tokens). Level: unit.
- **Per-module path budget:** each module's element count (`<path>`/`<rect>`/`<circle>`/`<polygon>`) is ≤ its declared cap. This is the literal §6.9 per-module budget. Level: unit.
- Module output passes `expectEmbedSafeSvg` (no script/URL/event handlers). Level: unit.
- `mural-vocabulary` palette values are stable constants (snapshot of the exported object). Level: unit.

**Components.**

```ts
// src/mural/mural-vocabulary.ts
export const MURAL_HEIGHT: number;              // ~360
export const MURAL_OUTLINE: string;             // thin dark outline, fixed across tiers/worlds
export const SKY_GRADIENT_STOPS: readonly ...;  // the only gradient in the mural
export const GROUND_TINT: Record<'ancient' | 'classical' | 'modern', string>;
export const MURAL_TYPOGRAPHY: { fontStack: string /* system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif */ };
export const Y_BANDS: { skyBottom; horizonBottom; roadBaseline; ribbonBottom; };

// src/mural/modules/structure.ts (+ marker.ts, prop.ts, tent.ts)
export type ModuleFill = { body: string; accent?: string };
export function structureModule(opts: { fill: ModuleFill; heightScale: number }): string; // normalized box
```

**Commit plan.**
1. `test: pin mural module primitives and path budget` — Failing tests for normalized-box modules, param recolor, per-module caps, embed-safety. Hygiene: test-only.
2. `feat: add mural vocabulary and module primitives` — Implement vocabulary constants and the four module functions. Hygiene: new `src/mural/` only, cosmic path untouched.

**Done when.** The four modules render in normalized boxes, recolor by param, respect per-module element caps, and are embed-safe; `mural-vocabulary` exposes the desert palette and canvas constants.

## Phase 2 — Scene spine: era partition, tiers, world scale

**Behavior delivered.** Pure functions build the temporal + scale skeleton of `MuralScene` from a snapshot, narrated chapters, and strengths — **no SVG**. (a) A contiguous **era partition**: each era carries `[startDate, endDate]`, consecutive eras meet (one era's `end` = next's `start`), covering `firstPublicActivityDate → capturedAtDate` with no gap/overlap; point chapters get neighbor-bounded windows (midpoints between adjacent anchor dates), the first stretch starts at `firstPublicActivityDate`, a present-day stretch runs to `capturedAtDate`. `firstPublicActivityDate === null` → a single `accountCreatedDate → capturedAtDate` stretch. (b) **Tier**: each era's `ancient|classical|modern` = which third of the user's own `[firstPublicActivityDate..capturedAtDate]` span its start falls in; the present-day stretch is forced `modern`. (c) **World scale**: `worldScale = { camp | town | metropolis }` from the **mean** of `ranked` reach (available dims only; nulls excluded so quiet dimensions never drag it down), banded by fixed thresholds, floored at `camp`, no seed.

**Test cases.**
- Eras partition `[firstPublicActivityDate..capturedAtDate]` with no gap and no overlap; every `contributionDays` date falls under exactly one era. Level: unit (rich + fifteen-year fixtures).
- Point chapter (e.g. `flagship-rise`) gets a window bounded by its neighbors' midpoints; a lone origin + present-day yields two contiguous eras. Level: unit.
- `firstPublicActivityDate === null` (brand-new) → single `accountCreatedDate..capturedAtDate` era. Level: unit.
- Tier = date-thirds of the user's own span; earliest era `ancient`, present-day `modern` regardless of where its start lands; a short (≤2-era) history skips `classical`. Level: unit.
- `worldScale` = mean of `ranked` reach → band; a single-spike modest profile (one high reach, rest low) → `camp` (**not** `metropolis`); rich → `metropolis`; zero-activity → `camp` floor. Level: unit.
- `worldScale` denominator excludes unavailable (null) dimensions. Level: unit.
- Determinism: same inputs → identical spine (no seed, no clock). Level: unit.

**Components.**

```ts
// src/mural/mural-scene.ts (types grow across P2/P3)
export type MuralTier = 'ancient' | 'classical' | 'modern';
export type WorldScale = 'camp' | 'town' | 'metropolis';
export type MuralEra = { chapter: Chapter | null; startDate: string; endDate: string; tier: MuralTier };

// src/mural/partition-eras.ts
export function partitionEras(snapshot: HistorySnapshot, narratedChapters: NarratedChapter[]): MuralEra[];
// src/mural/derive-tier.ts        — date-thirds of the user span
// src/mural/derive-world-scale.ts — mean(ranked.reach) → WorldScale, camp floor
```

**Commit plan.**
1. `test: pin mural era partition, tiers, and world scale` — Failing tests for partition/coverage, tier thirds, mean-reach banding, null exclusion, determinism. Hygiene: test-only.
2. `feat: add mural scene spine` — Implement partition, tier, world-scale derivation. Hygiene: pure data, no SVG.

**Done when.** The spine partitions the timeline honestly, assigns time-based tiers, and derives a broad-measure world scale that keeps one-spike accounts small — deterministically, over all fixtures.

## Phase 3 — Scene geometry fill: slots, ribbon buckets, terse text

**Behavior delivered.** The spine is filled into a complete `MuralScene`, still **no SVG**. (a) **Layout**: each era gets an X offset and width — width from a fixed per-chapter-kind constant table modulated by `worldScale` (bounded ±15%), plus a reserved present-day end-stretch width; total `W` is their sum plus margins. (b) **Typed slots**: each era exposes an ordered list of non-overlapping `{ x, width, baselineY, type }` slots (`structure | marker | prop`) **allocated** left-to-right (never placed-then-collision-checked); count from data + `worldScale`, structure heights from `worldScale`. Seed enters only to pick among interchangeable silhouettes / cosmetic jitter, never count or position. (c) **Ribbon buckets**: per era, its date-range `contributionDays` are aggregated into fixed **pixel-pitch** columns (`count = round(eraWidth / RIBBON_PITCH)`), each column a density value; quiet columns are pale-but-present. (d) **Terse text as data**: a new deterministic `src/mural/mural-text.ts` (per-kind templates + real substitutions from snapshot/strengths, `never`-exhaustiveness guard) produces each era's all-caps `title`, the strip `subtitle` (handle + one real fact: `dominantLanguage` / origin year / real repo name), the present-day `label`, and the assembled `<desc>` prose from the `narratedChapters` (`narrateChapter` reused unchanged). Every string has a safe default.

**Test cases.**
- Era X offsets are contiguous and non-overlapping; `W` = Σ widths + margins; width table modulated by `worldScale` stays within ±15% of the base. Level: unit.
- Slots within an era never overlap and stay within the era's X-span; slot/structure counts scale with `worldScale` (camp < town < metropolis). Level: unit.
- Grace floor: single-contribution fixture yields ≥ 1 camp structure + present-day stretch + a title + subtitle; brand-new yields the same minimum. Level: unit.
- Seed changes only interchangeable choices — two seeds produce identical slot geometry/counts, differing only in cosmetic module selection/jitter. Level: unit.
- Ribbon columns per era = `round(eraWidth / RIBBON_PITCH)`; each era's columns aggregate exactly that era's date-range days; a quiet era yields pale non-zero-height columns. Level: unit.
- `mural-text` returns an all-caps title per chapter kind, a real-fact subtitle when data allows and a generic fallback otherwise; XML-hostile substitutions are carried verbatim (escaping is the render layer's job). Level: unit.
- Determinism: same inputs → identical `MuralScene`. Level: unit.

**Components.**

```ts
// src/mural/mural-scene.ts (extended)
export type MuralSlot = { x: number; width: number; baselineY: number; type: 'structure' | 'marker' | 'prop' };
export type RibbonColumn = { x: number; width: number; density: number };
export type PlacedEra = MuralEra & { x: number; width: number; slots: MuralSlot[]; ribbon: RibbonColumn[]; title: string };
export type MuralScene = {
  handle: string; width: number; height: number; worldScale: WorldScale;
  eras: PlacedEra[]; subtitle: string; presentDayLabel: string;
  accessibleTitle: string; accessibleDescription: string;
};

// src/mural/build-mural-scene.ts
export function buildMuralScene(snapshot: HistorySnapshot, narratedChapters: NarratedChapter[], strengths: StrengthsResult): MuralScene;
// src/mural/era-widths.ts, src/mural/allocate-slots.ts, src/mural/ribbon-buckets.ts, src/mural/mural-text.ts
```

**Commit plan.**
1. `test: pin mural scene layout, slots, ribbon, and text` — Failing tests for widths/offsets, slot allocation, ribbon bucketing, terse-text templates + fallbacks, grace floor, determinism. Hygiene: test-only.
2. `feat: build complete mural scene model` — Implement widths, slot allocation, ribbon buckets, `mural-text`, and `buildMuralScene`. Hygiene: pure data, no SVG.

**Done when.** `buildMuralScene` produces a complete, deterministic `MuralScene` — contiguous eras with allocated slots, honest per-era ribbon columns, terse title/subtitle/label + accessible prose, grace-floored — with no SVG emitted.

## Phase 4 — Strip renderer skeleton

**Behavior delivered.** `renderMuralSvg(scene): string` emits the strip's backdrop and spine: a single `<svg viewBox="0 0 W H">`, the sky gradient (the only gradient), the distant terrain/horizon band, the **single continuous road/ground polyline** spanning full `W` at the road baseline (= ribbon top edge), and per-era ground tint feathered at seams by **flat-fill overlap** (no seam gradient). No structures, ribbon columns, or text yet. Per-era placement uses **local origins** (`translate(era.x, …)`) — no global center — so Stage 3 can later animate the top-level `viewBox` across the fixed strip. First committed example SVG.

**Test cases.**
- Output is one `<svg>` with `viewBox="0 0 <W> <H>"` where `W === scene.width`, `H === MURAL_HEIGHT`; exactly one gradient (`linearGradient`) and it is the sky. Level: unit.
- The road is one continuous element spanning `0 → W` at the road baseline; no per-era road segments. Level: unit.
- Seam transitions use flat fills only — no gradient outside the sky. Level: unit.
- Eras render under `translate(era.x, …)` with no absolute-center constant. Level: unit.
- Output passes `expectEmbedSafeSvg`. Level: unit.

**Components.**

```ts
// src/mural/render-mural-svg.ts
export function renderMuralSvg(scene: MuralScene): string; // grows P4→P7
// src/mural/layers/sky.ts, terrain.ts, road.ts (strip-level primitives)
```

Example: `examples/stage-1-phase-4/rich-history-account.svg` (road + bands only), generated through `buildMuralScene → renderMuralSvg` on the fixture.

**Commit plan.**
1. `test: pin mural strip skeleton` — Failing tests for viewBox/W-H, single-gradient sky, continuous road, local-origin eras, embed-safety. Hygiene: test-only.
2. `feat: render mural strip skeleton` — Implement sky/terrain/road layers and the strip frame; commit the phase-4 example. Hygiene: new render layer only.

**Done when.** `renderMuralSvg` emits a complete backdrop — sky, horizon, one unbroken road at the ribbon-top baseline, flat seams — at the data-summed width, embed-safe, with a committed example.

## Phase 5 — Structures and props

**Behavior delivered.** The slot packer's allocated slots are filled: tier-appropriate `structure`/`marker`/`prop` modules (Phase 1) are placed into each era's slots, colored by the era's tier ground/fill palette, sized by `worldScale` (count/density/height). A `camp` era renders few short structures sparsely; a `metropolis` era renders many tall structures densely. Modules stand on the road baseline growing upward. Committed example updated.

**Test cases.**
- Every allocated slot of a renderable type is filled by a module wrapped in `translate()/scale()`; modules sit on the road baseline. Level: unit.
- Tier drives module palette (ancient/classical/modern tints differ); `worldScale` drives count and max height (metropolis taller/denser than camp) on the same era shape. Level: unit.
- Grace floor: single-contribution fixture renders a visible camp (≥1 tent/structure + marker), never an empty era. Level: unit.
- No small-account decay: a low-`worldScale` scene without a `dark-age` chapter emits no ruin/decay modules. Level: unit.
- Output passes `expectEmbedSafeSvg`. Level: unit.

**Components.**

```ts
// src/mural/layers/structures.ts — map slots → placed modules by tier + worldScale
```

Example: `examples/stage-1-phase-5/rich-history-account.svg` (+ `single-contribution-account.svg` for the camp).

**Commit plan.**
1. `test: pin mural structures and world-scale density` — Failing tests for slot fill, tier palette, worldScale scaling, grace-floor camp, no-decay-for-small. Hygiene: test-only.
2. `feat: place mural structures at world scale` — Implement structure/prop placement; update examples. Hygiene: render layer only.

**Done when.** Structures fill the slots at tier palette and world-scale density; a modest account is a dignified camp, a rich account a dense metropolis; no small account renders decay.

## Phase 6 — Contribution ribbon

**Behavior delivered.** `renderMuralSvg` draws the ribbon band (road baseline → `~0.92H`) from the scene's per-era `RibbonColumn`s: fixed-pitch columns colored on a **warm desert density ramp** (not GitHub green), quiet columns pale-but-present, with the legend line `Less activity … More activity`. The ribbon reads as one continuous band across eras. The **whole-strip byte ceiling** guard lands here (first phase where the strip is substantially whole). Example updated.

**Test cases.**
- The ribbon spans `0 → W`; column count and X positions match `scene.eras[*].ribbon`; a boom era shows tall saturated columns, a quiet stretch pale short ones. Level: unit.
- Colors come from the warm ramp; no green tokens; the legend text is present. Level: unit.
- Honest coverage: summed column densities reflect the era's real `contributionDays` (no curated/faked columns). Level: unit.
- **Whole-strip byte ceiling:** the densest fixture (rich / fifteen-year) renders under the ceiling constant (calibrated from a measured dense render — see Named risks; leaves Stage-3 animation headroom). Level: unit.
- Output passes `expectEmbedSafeSvg`. Level: unit.

**Components.**

```ts
// src/mural/layers/ribbon.ts — columns + legend, warm density ramp
// mural-vocabulary: RIBBON_PITCH, RIBBON_RAMP, MURAL_BYTE_CEILING
```

Example: `examples/stage-1-phase-6/rich-history-account.svg`.

**Commit plan.**
1. `test: pin mural ribbon and strip byte ceiling` — Failing tests for column geometry, warm ramp + legend, honest coverage, byte ceiling. Hygiene: test-only.
2. `feat: render mural contribution ribbon` — Implement the ribbon layer and legend; set the measured byte ceiling; update example. Hygiene: render layer only.

**Done when.** The ribbon is one honest continuous band of warm density columns with the legend, and the dense strip stays under the calibrated byte ceiling.

## Phase 7 — Text render layer

**Behavior delivered.** `renderMuralSvg` emits the visible text — per-era all-caps `title` above each era, the strip `subtitle`, the present-day `label` — plus the accessibility surface the cosmic path lacks: `<title>The Epic of <handle></title>` and `<desc>` (the assembled narration prose). Every visible and `<title>`/`<desc>` string is routed through `escapeXmlText`; the `<desc>` builder never interpolates a URL. Text is pure emission of strings already on `MuralScene` (Phase 3). Example updated.

**Test cases.**
- Each era's `title`, the `subtitle`, and the present-day `label` appear as visible `<text>`; `<title>`/`<desc>` carry the handle and narration. Level: unit.
- Every visible + `<title>`/`<desc>` string is escaped; the **XML-hostile handle** (`buildHistorySnapshot({ handle: '<b>&"…' })`) renders and passes `expectEmbedSafeSvg` (no unescaped `<>&"`, no URL in `<desc>`). Level: unit.
- Text never gates render: an era whose real-fact subtitle is unavailable still renders a generic subtitle; no empty/crash. Level: unit.

**Components.**

```ts
// src/mural/layers/text.ts — visible caps text; src/mural/layers/accessibility.ts — <title>/<desc>
```

Example: `examples/stage-1-phase-7/rich-history-account.svg` + `xml-hostile-handle.svg`.

**Commit plan.**
1. `test: pin mural text layer and accessibility` — Failing tests for visible text, `<title>`/`<desc>`, escaping/embed-safety incl. XML-hostile, subtitle fallback. Hygiene: test-only.
2. `feat: render mural text and accessibility layer` — Implement visible text + `<title>`/`<desc>`; update examples. Hygiene: render layer only.

**Done when.** The mural shows terse caps titles/subtitle/label, exposes the narration via `<title>`/`<desc>`, escapes every string, and survives the XML-hostile handle embed-safe.

## Phase 8 — Entry, tooling, and golden verification

**Behavior delivered.** The thin entry `renderMural(snapshot): string` (`src/render-mural.ts`) runs `detectChapters` + `narrateChapter` + `scoreStrengths`, calls `buildMuralScene`, then `renderMuralSvg` — mirroring `renderEpic`, pure (no clock/`Math.random`; present-day from `snapshot.capturedAtDate`). A `pnpm render-mural <fixture-or-handle>` CLI (mirroring `scripts/render-fixture-to-svg.ts`) emits example SVGs. Committed golden SVGs pin the output; determinism and the "cosmic untouched" regression are asserted. `renderMural` is exported from `src/index.ts`.

**Test cases.**
- `renderMural(snapshot)` renders each verification fixture — rich, single-contribution, brand-new (zero-activity), fifteen-year-overflow, modest (`mohasarc-captured.json` if it reads modest-but-nonzero, else a small added modest fixture) — to a complete strip. Level: unit.
- **Committed golden:** `renderMural(rich)` byte-equals `examples/stage-1-phase-8/rich-history-account.svg`. Level: unit (golden compare, the repo pattern).
- **Determinism:** `renderMural(snapshot)` twice → byte-identical, for all fixtures. Level: unit.
- **Cosmic unchanged:** `renderEpic(rich)` byte-equals its existing cosmic golden (the path is untouched; assert to lock it). Level: regression note.
- Two genuinely similar snapshots produce similar strips (same `worldScale`, comparable era/slot counts). Level: unit.

**Components.**

```ts
// src/render-mural.ts
export function renderMural(snapshot: HistorySnapshot): string;
// scripts/render-mural-to-svg.ts — pnpm render-mural <fixture|handle>; package.json script
// src/index.ts — export { renderMural }
```

Examples: `examples/stage-1-phase-8/{rich-history,single-contribution,brand-new,fifteen-year-overflow,modest}.svg`.

**Commit plan.**
1. `test: pin renderMural output and determinism` — Failing tests for per-fixture render, golden compare, determinism, cosmic-unchanged, similar-look. Hygiene: test-only.
2. `feat: add renderMural entry and tooling` — Implement `renderMural`, the CLI, the package script, `index.ts` export; commit goldens/examples. Hygiene: entry + tooling.

**Done when.** `renderMural` renders every verification fixture to a complete deterministic strip matching a committed golden, the cosmic path is provably unchanged, and the CLI emits examples.

## Phase 9 — Preview surface

**Behavior delivered.** The mural is reachable at `/<handle>.svg?preview=mural` without changing the default. `route-service-request.ts` (which currently discards the query at `url.split('?')[0]`) parses `preview` and threads a `variant: 'cosmic' | 'mural'` into `handleImageRequest`, which selects `renderEpic` vs `renderMural`. The bare URL and every existing response stay byte-identical. The cache is **kept** (not bypassed) with a variant-scoped key: default variant = the exact current lowercased-handle key (existing entries/tests untouched); mural = `${key}:mural` — no collision, both cache-friendly.

**Test cases.**
- `/<handle>.svg` (no param) → cosmic `renderEpic`, byte-identical to current behavior; existing `handle-image-request` / `route-service-request` tests pass unchanged. Level: unit.
- `/<handle>.svg?preview=mural` → mural `renderMural`; a `preview` value other than `mural` falls back to cosmic. Level: unit.
- Cache: a cosmic render and a mural render for the same handle occupy distinct keys (`key` vs `key:mural`); neither serves the other's bytes; each is cached (no refetch on second hit). Level: unit.
- HEAD and error/rate-limit/unknown-handle paths behave identically across variants (cards are variant-agnostic). Level: unit.

**Components.**

```ts
// src/service/route-service-request.ts — parse ?preview, pass variant
// src/service/handle-image-request.ts — variant: 'cosmic' | 'mural'; renderer + variant-scoped cache key
```

**Commit plan.**
1. `test: pin mural preview surface and variant cache` — Failing tests for param routing, default-unchanged, variant-scoped cache keys, error-path parity. Hygiene: test-only.
2. `feat: add mural preview surface` — Parse `?preview=mural`, thread the variant, variant-scoped cache key. Hygiene: service layer only.

**Done when.** `/<handle>.svg?preview=mural` serves the mural, the bare URL is byte-identical to today, and cosmic/mural cache entries never collide.

## Named risks

- **Byte-ceiling calibration (Phase 6).** The binding budget is the **animated** strip (Stage 3), which SMIL will multiply. Measure a real dense render first (rich / fifteen-year mural), then set `MURAL_BYTE_CEILING` just above the measured static size (target ballpark ~120KB) so bloat is caught now with animation headroom left — do not rubber-stamp a round number.
- **Era partition honesty (Phase 2).** Point chapters share no native span; the synthesized neighbor-bounded windows must tile contiguously so every contribution day lands under exactly one era. A gap drops activity, an overlap double-counts — both dishonest. The coverage test (every `contributionDays` date under exactly one era) is the guard.
- **World-scale calibration (Phase 2).** `worldScale` from mean-reach decides camp/town/metropolis for every account; the band thresholds are the mapping. A one-spike modest account must stay `camp` (its spike becomes Stage 2's monument, not overall scale). The single-spike → camp test is the guard; calibrate thresholds against the fixtures, don't defer.
- **Modest fixture gap.** No committed fixture is explicitly "modest." Inspect `mohasarc-captured.json`; if it is not modest-but-nonzero, add a small modest fixture in Phase 8 rather than skipping the §3.5 feel-good guarantee.

## Out of scope

- Dimension **motifs**, standout monuments, number-plaques, and the badge finale — Stage 2 (they layer on this stage's world scale and slot grammar).
- **Animation** of any kind — the dwell-and-zip camera, parallax, ambient loops — Stage 3.
- **River and mountain** worlds and the `world` URL parameter — Stage 4 (the module fill-param contract is built here to make that mechanical).
- The **row-wrapped static export** and its exact-per-day ribbon — Stage 5.
- Flipping the **default** embed or retiring the cosmic render — Stage 6; the cosmic path stays live and byte-identical this stage.
- Any **LLM**; any non-deterministic input; any seed use beyond breaking interchangeable cosmetic ties.
