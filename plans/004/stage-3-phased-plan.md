# Stage 3 phased plan — full replay and ambient rendering

Phased implementation plan for [Stage 3 of the staged plan](../000/stages.md#stage-3--full-replay-and-ambient-rendering): a scene per chapter type in the chosen style, full replay within the 35-second budget, ambient state derived from the history. Behavior source of truth: [functional spec](../000/git-epic-functional-spec.md) §6, §8.1, Amendment 1.

## Goal

After all phases: every one of the seven chapter kinds renders its own scene in the universe-from-first-commit style (no placeholder left), the rich-history fixture replays all seven scene kinds within the ≤ 35 s budget, the ambient layer's orbiting bodies and twinkle stars are derived from the account's repositories and stars instead of fixed counts, the committed examples and README embed show the full saga, and byte-determinism holds throughout.

## Context

Pipeline: `renderEpic` (src/render-epic.ts) → `detectChapters` → `narrateChapter` → `buildTimeline` (src/timeline/build-timeline.ts) → `renderEpicSvg` (src/rendering/render-epic-svg.ts). Six chapter kinds currently hit `placeholderSceneVisual()` (render-epic-svg.ts:143-168); `originSpark` is the only real scene. The ambient layer (`renderAmbientLayer`, :218-266) draws fixed motifs: one dashed halo, one pulsing core, one orbiting body, 8 twinkles. Style tokens live in `src/rendering/visual-vocabulary.ts` (PALETTE, TYPOGRAPHY, STYLE_MOTION). Timing constants already encode the spec budget (3 + 8×3.5 + 3 = 34 ≤ 35 s; src/timeline/timing-constants.ts, `MAX_CHAPTERS = 8` in order-chapters.ts). `rich-history-account.json` fires all seven rules in exactly 8 chapters — it is the stage's done-when fixture. Byte-determinism and embed-safety run over full renders (src/render-epic.test.ts:25-29, `expectEmbedSafeSvg`). Verification gate per phase: `pnpm test && pnpm lint && pnpm typecheck`.

Decisions this plan encodes (agreed in design dialogue):

- **Scene modules.** `src/rendering/scenes/<kind>-scene.ts`, seven files including origin (uniform switch, zero special cases), one exported function per file taking `ChapterSceneSegment`, colocated tests. Extraction of existing visuals is a byte-identical mechanical move committed before any new scene.
- **Shared primitives.** `src/rendering/scene-primitives.ts` exports `sparkGlow`, `expandingRing` (generalized with cx/cy), `centeredText` + `CenteredTextOptions`, `fadingRule`, `ornamentDot`, and the canvas geometry constants — scenes importing from `render-epic-svg.ts` would cycle. `render-epic-svg.ts` keeps the dispatch switch, `composedCaption` (frame chrome), segment reveal, backdrop, gradients, ambient.
- **Motifs** (all from Amendment 1 vocabulary; exact geometry/timing pinned during implementation): language-era — fixed body pair, indigo `#9aa8ff` fades while blue `#9ad2ff` rises, no hashing; flagship-rise — ascending body with converging gold stars; star-milestone — radial gold-star burst, count banded by exhaustive switch on the `100 | 1000 | 10000` threshold literal; dark-age — translucent background-colored dimming rect inside the segment group, cold indigo ember, fading ring; great-streak — comet (spark-glow head, tapering starlight trail) in a one-shot traverse; prolificacy — staggered ring of sparks blooming outward. Accepted overlap: flagship-rise and star-milestone both use converging gold stars; focus differs (body vs core) and narration disambiguates.
- **No text inside any scene.** The narration caption (frame chrome) carries names, years, numbers — Amendment 1's text-minimal rule.
- **Scene motion contract.** One-shot `fill="freeze"` beats offset from `segment.startSeconds`, beginning ≥ ~0.2 s after start and settling before the segment's 88% fade-out (`segmentRevealAnimation` keyTimes `0;0.12;0.88;1`), completing within the 3.5 s window — the `originSpark` shape.
- **Ambient derivation.** `src/timeline/derive-ambient-scene.ts`, called by `buildTimeline`; `AmbientScene` gains derived driver fields; the renderer stays pure over `Timeline`, scenes never see the snapshot. Mappings: repository count → orbiting body count (capped 1..5, floor 1; per-body radius/period/accent varied by index, not by the seeded random stream); total star count → twinkle star count (banded, floor 8 ≈ today). Core and halo stay fixed; no nebula-intensity mapping. Zero-history ambient stays visually ≈ today's (grace floor). Exact bands pinned during implementation against band-edge tests.
- **No timing changes.** Budget pinned by a regression test on the rich-history fixture: `replayEndSeconds ≤ 35`, exactly 8 chapter-scene segments, every scene kind's markup present. Present-day card unchanged — the ambient layer is the spec's "accumulated present-day scene".
- **Verification.** Determinism via the existing fixture byte-identity loop; scene tests assert structural distinguishing markers; embed-safety stays a full-render check. Camo verification stays ad-hoc (stage-0 procedure), applied once to the full-length rich-history render in the final phase's PR. No committed browser automation, no SMIL file-size guard — camo playability is the gate.
- **Examples.** Final phase regenerates committed artifacts and refreshes the README embed — ambient bytes change for every user.

Open questions: none. Values marked "pinned during implementation" (band edges, star counts per milestone band, scene geometry) are agreed deferrals resolved by their phase's tests.

## Phases

## Phase 1 — Extract scene primitives and the origin scene

**Behavior delivered.** No visual change — `renderEpicSvg` output stays byte-identical. The rendering module gains the structure the six new scenes plug into: shared primitives in one module, scenes in their own directory, geometry constants importable without cycles.

**Test cases.** (unit, colocated)

- Byte-identity across the refactor: render each fixture before the move, pin the outputs in a temporary comparison during development (the committed suite's run-to-run determinism cases at `render-epic.test.ts:25-29` must stay green; the before/after byte check is performed with `pnpm render-fixture` and recorded in the phase's PR).
- `origin-scene.test.ts`: origin scene output contains the spark nucleus, the glow, and two expanding rings with `fill="freeze"` — moved coverage, assertions carried from what `render-epic-svg.test.ts` pins today plus a distinguishing-marker case.
- Existing `render-epic-svg.test.ts` cases stay green unchanged.

**Components.**

```ts
// src/rendering/scene-primitives.ts — moved from render-epic-svg.ts, then generalized
export const CANVAS_WIDTH = 830;
export const CANVAS_HEIGHT = 415;
export const CENTER_X: number;
export const SCENE_CENTER_Y: number;

export type CenteredTextOptions = {
  fontSize: number;
  fill: string;
  fontWeight?: string;
  fontStyle?: string;
  letterSpacing?: number;
};
export function centeredText(content: string, x: number, y: number, options: CenteredTextOptions): string;
export function sparkGlow(x: number, y: number, radius: number): string;
export function fadingRule(x: number, y: number, width: number): string;
export function ornamentDot(x: number, y: number): string;

export type ExpandingRingOptions = {
  cx: number;
  cy: number;
  beginSeconds: number;
  fromRadius: number;
  toRadius: number;
  strokeColor: string;
  strokeWidth: number;
  peakOpacity: number;
};
export function expandingRing(options: ExpandingRingOptions): string;
```

```ts
// src/rendering/scenes/origin-scene.ts — originSpark moved, renamed, segment-typed
export function originScene(segment: ChapterSceneSegment): string;
```

`render-epic-svg.ts` keeps `chapterSceneVisual` (dispatch), `composedCaption`, `segmentRevealAnimation`, backdrop, gradients, ambient, `placeholderSceneVisual` (dies in phases 2–3).

**Commit plan.**

1. `refactor: extract scene-primitives module` — pure move of `sparkGlow`, `centeredText` + options type, `fadingRule`, `ornamentDot`, geometry constants out of `render-epic-svg.ts`; imports updated. Pure move, no edits.
2. `refactor: generalize expandingRing to take a center` — moves `expandingRing` into scene-primitives with the options object; the origin callsite passes today's values, output bytes unchanged. Refactor only, no behavior change.
3. `refactor: move the origin scene into scenes/` — `originSpark` becomes `scenes/origin-scene.ts`'s `originScene(segment)`; its test cases move to `origin-scene.test.ts`. Pure move, no edits beyond the segment parameter.

**Done when.** All suites green; `pnpm render-fixture` output byte-matches a pre-refactor render for every fixture; gate passes.

## Phase 2 — Star-forge scenes: flagship rise, star milestone, prolificacy

**Behavior delivered.** Three chapter kinds stop rendering the placeholder: flagship-rise shows an ascending body with gold stars converging around it, star-milestone a radial gold-star burst sized by threshold, prolificacy a staggered outward bloom of sparks.

**Test cases.** (unit, colocated, written first per scene)

- `flagship-rise-scene.test.ts`: output contains the ascending body and converging star elements with one-shot `fill="freeze"` animations offset from `segment.startSeconds`; no `<text` element in the scene output; distinguishing marker distinct from the milestone burst.
- `star-milestone-scene.test.ts`: star count differs across the three thresholds (one case per literal — exhaustive switch means a new threshold fails compilation); animations are one-shot; no text.
- `prolificacy-scene.test.ts`: staggered spark ring — multiple sparks whose `begin` offsets ascend within the 3.5 s window; no text.
- `render-epic-svg.test.ts`: dispatch case — a timeline containing each of the three kinds renders that scene's distinguishing markup, not the placeholder.

**Components.**

```ts
// src/rendering/scenes/flagship-rise-scene.ts
export function flagshipRiseScene(segment: ChapterSceneSegment): string;

// src/rendering/scenes/star-milestone-scene.ts
export function starMilestoneScene(segment: ChapterSceneSegment): string;

// src/rendering/scenes/prolificacy-scene.ts
export function prolificacyScene(segment: ChapterSceneSegment): string;
```

Milestone band shape (values pinned in this phase's tests):

```ts
// star-milestone-scene.ts — exhaustive over the threshold literal
function burstStarCount(threshold: 100 | 1000 | 10000): number;
```

Any new motif constants (convergence radii, bloom stagger step) go to `visual-vocabulary.ts`'s `STYLE_MOTION`/`PALETTE` if style, or stay local if geometry.

**Commit plan.**

1. `test: pin the flagship-rise scene contract` — red distinguishing-marker test. Test-first.
2. `feat: draw the flagship-rise scene` — scene module plus dispatch switch entry; placeholder callsite for this kind removed. One logical change.
3. `test: pin the star-milestone scene contract` — red test including the per-threshold band cases. Test-first.
4. `feat: draw the star-milestone scene` — scene plus dispatch entry.
5. `test: pin the prolificacy scene contract` — red test. Test-first.
6. `feat: draw the prolificacy scene` — scene plus dispatch entry.

**Done when.** Three kinds render distinct scenes (eyeballed via `pnpm render-fixture test-fixtures/rich-history-account.json`); byte-determinism loop green; no `<text` inside any scene output; gate passes.

## Phase 3 — Era scenes: language era, dark age, great streak

**Behavior delivered.** The remaining three kinds stop rendering the placeholder: language-era shows the indigo body fading as the blue body rises, dark-age dims the cosmos to a cold ember, great-streak sends a comet across the scene. `placeholderSceneVisual` is deleted.

**Test cases.** (unit, colocated, written first per scene)

- `language-era-scene.test.ts`: both accent bodies present (`#9aa8ff` fading, `#9ad2ff` rising) with opposing opacity animations; fixed pair regardless of the chapter's languages; no text.
- `dark-age-scene.test.ts`: dimming rect uses `PALETTE.background` with partial opacity and sits inside the scene output (segment reveal makes it vanish with the segment); indigo ember and fading ring present; no text.
- `great-streak-scene.test.ts`: comet head plus trail elements; traverse is one-shot `fill="freeze"` completing within the scene window; no text.
- `render-epic-svg.test.ts`: placeholder gone — every chapter kind dispatches to a named scene; a full rich-history render contains all seven scenes' distinguishing markers.

**Components.**

```ts
// src/rendering/scenes/language-era-scene.ts
export function languageEraScene(segment: ChapterSceneSegment): string;

// src/rendering/scenes/dark-age-scene.ts
export function darkAgeScene(segment: ChapterSceneSegment): string;

// src/rendering/scenes/great-streak-scene.ts
export function greatStreakScene(segment: ChapterSceneSegment): string;
```

`placeholderSceneVisual` deleted from `render-epic-svg.ts` in the same commit as the last scene wiring (its last caller).

**Commit plan.**

1. `test: pin the language-era scene contract` — red test. Test-first.
2. `feat: draw the language-era scene` — scene plus dispatch entry.
3. `test: pin the dark-age scene contract` — red test. Test-first.
4. `feat: draw the dark-age scene` — scene plus dispatch entry.
5. `test: pin the great-streak scene contract` — red test. Test-first.
6. `feat: draw the great-streak scene` — scene plus dispatch entry; deletes now-unreferenced `placeholderSceneVisual`. One logical change (the deletion is the wiring's dead code).

**Done when.** All seven kinds render distinct scenes; placeholder deleted; rich-history render eyeballed; determinism loop green; gate passes.

## Phase 4 — History-derived ambient

**Behavior delivered.** The ambient cosmos accumulates the history: an account with many repositories shows more orbiting bodies (up to 5, varied in radius, period, and accent color by index), an account with more total stars shows more twinkle stars. A zero-history account still gets today's dignified ambient.

**Test cases.** (unit, colocated, written first)

- `derive-ambient-scene.test.ts`: band edges — repository counts at each band boundary map to the expected body count (floor 1, cap 5); total star counts at each boundary map to the expected twinkle count (floor 8); zero-history snapshot yields the floor values.
- `build-timeline.test.ts` addition: `ambient` carries the derived fields for a snapshot with known repositories/stars.
- `render-epic-svg.test.ts` additions: ambient layer renders exactly `orbitingBodyCount` orbiting bodies with distinct per-index attributes; twinkle count follows `twinkleStarCount`; core, halo, attribution lines unchanged.
- Existing grace-floor fixture cases stay green (single-contribution, brand-new accounts).

**Components.**

```ts
// src/timeline/derive-ambient-scene.ts
export type AmbientVisualDrivers = {
  /** 1..5, from repository count. */
  orbitingBodyCount: number;
  /** Floor 8, banded from total star count. */
  twinkleStarCount: number;
};
export function deriveAmbientScene(snapshot: HistorySnapshot): AmbientVisualDrivers;
```

```ts
// src/timeline/timeline.ts
export type AmbientScene = {
  handle: string;
  epicOfLine: string;
  creditLine: string;
  orbitingBodyCount: number;
  twinkleStarCount: number;
};
```

`buildTimeline` spreads `deriveAmbientScene(snapshot)` into `ambient`. `renderAmbientLayer` loops bodies by index (radius/period/accent varied deterministically by index, off the seeded random stream) and passes the twinkle count to `renderTwinklingStars`. Exact band edges pinned by this phase's tests.

**Commit plan.**

1. `test: pin ambient derivation band edges` — red test defining the mapping contract. Test-first.
2. `feat: add deriveAmbientScene` — the module only, no callsites yet. Type-and-module first, no consumers.
3. `feat: extend AmbientScene with visual drivers` — type change plus `buildTimeline` wiring plus its test. One logical change (the type is unusable half-extended; renderer untouched).
4. `feat: drive ambient bodies and twinkles from the history` — `renderAmbientLayer` consumes the fields; render tests updated in the same commit they break.

**Done when.** Rich-history ambient visibly differs from grace-floor ambient (eyeballed); zero-history ambient ≈ today's; determinism loop green; gate passes.

## Phase 5 — Budget pin, examples, README

**Behavior delivered.** The 35-second budget is pinned by a regression test; the repo showcases the full saga: regenerated example artifacts and README embed, camo-verified.

**Test cases.** (unit)

- `build-timeline.test.ts` addition (budget regression): rich-history fixture yields `replayEndSeconds ≤ 35` and exactly 8 chapter-scene segments.
- `render-epic.test.ts` addition: the rich-history render contains every scene kind's distinguishing marker (all seven fire in that fixture) — the stage's done-when in test form.

**Components.**

- `examples/stage-3-phase-5/rich-history-account.svg` — regenerated via `pnpm render-fixture`, plus a `.scene.png` still (precedent: `examples/stage-2-phase-6/`, `examples/stage-0-phase-5/`).
- `README.md` — embed refreshed to the new artifact path.

**Commit plan.**

1. `test: pin the replay budget and full scene coverage` — both regression tests; green immediately if phases 2–4 landed correctly, still committed first as the stage's acceptance pin.
2. `docs: add full-saga example render` — regenerated svg + png artifacts. One logical change.
3. `docs: refresh the README epic embed` — the embed swap. Separate from artifact generation.

**Done when.** Both regression tests green; README on github.com shows the full epic animating (stage-0 camo procedure: SHA-pinned raw URL, nonzero natural dimensions, two differing frames within the replay — observed and recorded in the PR's Output preview, per-scene visual correctness judged from the committed still); artifacts byte-match a fresh render; gate passes.

## Out of scope

- Fetching live GitHub data — Stage 4 (`plans/000/stages.md`).
- HTTP serving, caching, error-state cards ("no such legend", "still being written") — Stage 5.
- Detection, narration, fixture, or timing-constant changes — locked by Stages 1–2 and the spec; Stage 3 touches rendering and the timeline's ambient derivation only.
- Committed browser-verification automation and SMIL file-size guards — camo playability stays the ad-hoc gate.
- Nebula-intensity ambient mapping — deliberately skipped; a one-file addition to `derive-ambient-scene.ts` if ambient reads too static later.
