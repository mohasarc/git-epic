# Stage 1 phased plan — grace-floor epic, end to end

Phased implementation plan for [Stage 1 of the staged plan](../000/stages.md#stage-1--grace-floor-epic-end-to-end): the smallest complete epic, from fixture snapshot to deterministic animated SVG. Behavior source of truth: [functional spec](../000/git-epic-functional-spec.md).

## Goal

After all phases: `renderEpic(snapshot)` turns a JSON fixture of a user's public history into a complete animated SVG — title card, Origin chapter with templated narration, present-day card, ambient state with permanent attribution — byte-identical on every run, playable inside a GitHub README, eyeballable locally with one command. Both grace-floor cases work: single-contribution account and zero-activity account.

## Context

`src/` is empty; this plan creates the first source. Tooling exists: vitest (`src/**/*.test.ts`, colocated), eslint (`src/**/*.ts` only), `tsc` build via `tsconfig.build.json` (excludes `src/**/*.test.ts`), package exports single `.` entry → `dist/index.js`. `temp/` is gitignored. Verification gate for every phase: `pnpm test && pnpm lint && pnpm typecheck`.

Pipeline shape being locked (Stage 1's real deliverable):

```
HistorySnapshot → detect chapters → narrate → build timeline → render SVG
   (chapters/)      (narration/)     (timeline/)   (rendering/)
```

Everything left of `rendering/` is style-agnostic data. `rendering/` is the only module that knows what anything looks like — a Stage 0 restyle lands as a rendering-only change.

Decisions this plan encodes (agreed in design dialogue):

- Public API: `renderEpic(snapshot: HistorySnapshot): string` plus the type, nothing else exported from `src/index.ts`.
- Dates are date-only ISO `YYYY-MM-DD`, UTC. No time-of-day anywhere.
- Timing: title 3s, chapter scene 3.5s, present-day card 3s. Budget arithmetic: 3 + 8×3.5 + 3 = 34 ≤ 35s spec cap. `build-timeline` is the sole timing owner; rendering never re-accumulates durations.
- SMIL only: absolute `begin` offsets from document load, `fill="freeze"`, static `opacity="0"` on segment groups, ambient `repeatCount="indefinite"`. No CSS animation, no scripts, no external refs, system font stack, no dependence on measured text width.
- Seed: FNV-1a 32-bit over UTF-8 bytes of `snapshot.handle`, carried on `Timeline`; mulberry32 PRNG in rendering is the only randomness source.
- Determinism test is render-twice-byte-identical, not a committed golden file.
- Fixtures live at repo-root `test-fixtures/`, never shipped; loader in `src/test-support/`, excluded from build.

## Phases

## Phase 1 — History snapshot type, fixtures, loader

**Behavior delivered.** The pipeline's input exists: `HistorySnapshot` type, two grace-floor fixtures, and a loader tests and scripts share.

**Test cases.** (unit, `src/test-support/load-history-snapshot-fixture.test.ts`)

- Loading `single-contribution-account.json` returns a snapshot with `handle`, `accountCreatedDate`, non-null `firstPublicActivityDate`, `capturedAtDate` — asserts exact fixture values.
- Loading `brand-new-account.json` returns `firstPublicActivityDate: null`.
- Loading a nonexistent fixture name throws with the attempted path in the message.

**Components.**

```ts
// src/history-snapshot.ts
/** Dates are date-only ISO strings (YYYY-MM-DD), UTC. */
export type HistorySnapshot = {
  /** GitHub login, canonical casing (canonicalization is the Stage 4 fetch layer's job). */
  handle: string;
  accountCreatedDate: string;
  /** null for an account with zero public activity. No ordering guarantee vs accountCreatedDate. */
  firstPublicActivityDate: string | null;
  /** The "now" the present-day card marks. In the snapshot so rendering stays pure. */
  capturedAtDate: string;
};

// src/test-support/load-history-snapshot-fixture.ts
export function loadHistorySnapshotFixture(fixtureFileName: string): HistorySnapshot;
```

Fixtures: `test-fixtures/single-contribution-account.json`, `test-fixtures/brand-new-account.json`.

**Commit plan.**

1. `feat: add HistorySnapshot type` — type only, no callsites.
2. `test: add grace-floor fixtures and loader tests` — fixtures + failing tests; red commit is informative (loader missing).
3. `feat: add history snapshot fixture loader` — makes tests green; includes the one-line `tsconfig.build.json` exclude of `src/test-support`.

**Done when.** Tests green; `pnpm build` output contains no test-support or fixture files.

## Phase 2 — Origin chapter detection

**Behavior delivered.** `detectChapters(snapshot)` returns the Origin chapter — dated for an active account, undated for a zero-activity account.

**Test cases.** (unit, colocated)

- `detectOriginChapter`: snapshot with `firstPublicActivityDate` → `{ kind: 'origin', date: <that date> }`.
- `detectOriginChapter`: null activity → `{ kind: 'origin', date: null }`.
- `detectChapters`: returns exactly `[originChapter]` for both fixtures (Origin always fires — no minimum-activity rejection, spec 3.6).

**Components.**

```ts
// src/chapters/chapter.ts
export type OriginChapter = { kind: 'origin'; date: string | null };
/** Discriminated union; six more chapter kinds arrive in Stage 2. */
export type Chapter = OriginChapter;

// src/chapters/origin-chapter.ts
export function detectOriginChapter(snapshot: HistorySnapshot): OriginChapter;

// src/chapters/detect-chapters.ts
/** Stage 2 adds ordering, precedence tie-breaking, and the 8-chapter cap here. */
export function detectChapters(snapshot: HistorySnapshot): Chapter[];
```

**Commit plan.**

1. `feat: add Chapter type` — type only.
2. `feat: add origin chapter detection` — rule + detectChapters + their tests (test-first within the commit; red state alone is not informative).

**Done when.** Both fixtures produce their expected chapter list; gate green.

## Phase 3 — Origin narration

**Behavior delivered.** `narrateChapter` produces the Origin caption in the epic register; zero-activity accounts get the spec-verbatim grace-floor line.

**Test cases.** (unit, colocated)

- Dated origin → pinned exact sentence containing the year as a numeral (spec register example: "In the year 2019, …"). Exact wording chosen at implementation; the test pins whatever lands, because narration is part of the byte-deterministic document.
- Undated origin → pinned sentence containing spec 3.6's phrase "the epic has just begun" verbatim.
- Exhaustiveness: narrating every `Chapter` kind compiles without a default case (switch on `kind` with `never` check), so Stage 2 kinds can't silently narrate as nothing.

**Components.**

```ts
// src/narration/narrate-chapter.ts
export function narrateChapter(chapter: Chapter): string;
```

Template strings live in this module as data. One template per chapter kind, no seeded variants. Number-spelling helper is Stage 2 scope (Origin has no counts).

**Commit plan.**

1. `feat: add origin chapter narration` — templates + function + pinning tests.

**Done when.** Both narration strings pinned by tests; gate green.

## Phase 4 — Timeline

**Behavior delivered.** `buildTimeline` assembles narrated chapters into the style-agnostic replay description: ordered segments with precomputed start/duration, seed, and the ambient scene with attribution lines.

**Test cases.** (unit, colocated)

- Segment sequence for the single-contribution fixture: title-card (start 0, 3s) → chapter-scene (start 3, 3.5s, carries chapter + narration) → present-day-card (start 6.5, 3s); `replayEndSeconds` = 9.5.
- Title card carries handle and origin year derived from `accountCreatedDate`.
- Present-day card carries `capturedAtDate`.
- Ambient scene: `epicOfLine` = "The Epic of <handle>", `creditLine` = "✦ forge yours at git-epic.dev".
- `deriveSeedFromHandle`: pinned exact FNV-1a values for known handles (catches cross-platform/refactor drift).
- Same fixture twice → deeply equal timelines.

**Components.**

```ts
// src/timeline/timeline.ts
export type TitleCardSegment = {
  kind: 'title-card'; startSeconds: number; durationSeconds: number;
  handle: string; originYear: number;
};
export type ChapterSceneSegment = {
  kind: 'chapter-scene'; startSeconds: number; durationSeconds: number;
  chapter: Chapter; narration: string;
};
export type PresentDayCardSegment = {
  kind: 'present-day-card'; startSeconds: number; durationSeconds: number;
  capturedAtDate: string;
};
export type TimelineSegment = TitleCardSegment | ChapterSceneSegment | PresentDayCardSegment;
export type AmbientScene = { handle: string; epicOfLine: string; creditLine: string };
export type Timeline = {
  handle: string;
  seed: number;
  segments: TimelineSegment[];
  replayEndSeconds: number;
  ambient: AmbientScene;
};

// src/timeline/timing-constants.ts
export const TITLE_CARD_SECONDS = 3;
export const CHAPTER_SCENE_SECONDS = 3.5;
export const PRESENT_DAY_CARD_SECONDS = 3; // 3 + 8×3.5 + 3 = 34 ≤ 35s spec cap

// src/timeline/attribution.ts — single flip point for the closing-stage domain cutover
export const CREDIT_LINE = '✦ forge yours at git-epic.dev';
export function epicOfLine(handle: string): string; // "The Epic of <handle>"

// src/timeline/derive-seed-from-handle.ts
/** FNV-1a 32-bit over UTF-8 bytes of the handle. */
export function deriveSeedFromHandle(handle: string): number;

// src/timeline/build-timeline.ts
export type NarratedChapter = { chapter: Chapter; narration: string };
export function buildTimeline(snapshot: HistorySnapshot, narratedChapters: NarratedChapter[]): Timeline;
```

**Commit plan.**

1. `feat: add Timeline types` — types only, no callsites.
2. `feat: add timing and attribution constants` — declarative values + seed derivation with pinned-value tests.
3. `feat: add buildTimeline` — assembly + segment/ambient tests.

**Done when.** Timeline tests green including pinned seed values; gate green.

## Phase 5 — SVG rendering

**Behavior delivered.** `renderEpicSvg(timeline)` produces the full animated document: 830×415 dark canvas, SMIL replay of the segments, ambient state looping forever — in the placeholder rendition of the universe-from-first-commit style.

**Test cases.** (unit, colocated)

- `escapeXmlText`: escapes `& < > " '`; passes plain text through.
- `formatSvgNumber`: fixed precision, no scientific notation, no trailing-zero variance (pinned examples including 3.5 and float-sum cases).
- `createSeededRandom`: pinned first-N sequence for a known seed; values in [0, 1).
- Root element: `width="830" height="415"` and matching `viewBox`.
- Every segment renders a group with static `opacity="0"` and an `<animate>` whose `begin` equals `<segment.startSeconds>s` — timing read from the timeline, never re-derived.
- Ambient layer: contains `epicOfLine` and `creditLine` text, an animation with `begin="<replayEndSeconds>s"`, and `repeatCount="indefinite"`.
- Handle rendered uppercase on the title card ("THE EPIC OF <HANDLE>") with origin year.
- Structural safety (spec 3.5 preconditions, mechanical): output contains no `<script`, no `http://` or `https://`, no `@import`, no `on*=` event attributes.
- Handle needing XML escaping renders as escaped text (defense in depth; real handles are `[A-Za-z0-9-]`).

**Components.**

```ts
// src/rendering/escape-xml-text.ts
export function escapeXmlText(text: string): string;

// src/rendering/format-svg-number.ts
export function formatSvgNumber(value: number): string;

// src/rendering/seeded-random.ts
/** mulberry32. Only randomness source in the package (eslint enforces no Math.random in src). */
export function createSeededRandom(seed: number): () => number;

// src/rendering/render-epic-svg.ts — the only style-aware module
export function renderEpicSvg(timeline: Timeline): string;
```

Rendering constraints (module-level, Stage 3 inherits them): fixed positions and `text-anchor` alignment only — never measured text width; system font stack; starfield/placeholder-scene geometry drawn from `createSeededRandom(timeline.seed)`; all numeric attributes through `formatSvgNumber`.

eslint addition in this phase: `no-restricted-properties` forbidding `Math.random` in `src/`.

**Commit plan.**

1. `feat: add xml escaping and svg number formatting` — leaf helpers + tests.
2. `feat: add seeded random generator` — PRNG + pinned-sequence tests.
3. `chore: forbid Math.random in src via eslint` — config only.
4. `feat: render epic svg from timeline` — scenes + SMIL + structural-safety tests. Largest commit; splitting it would leave non-rendering intermediate states with nothing observable to test.

**Done when.** All rendering tests green including structural safety; `temp/`-rendered output opens in a browser and visibly plays title → origin → present → ambient (implementer eyeball, using the Phase 6 script pre-wired or a throwaway invocation).

## Phase 6 — Public API, determinism, eyeball script

**Behavior delivered.** The package does its Stage 1 job end to end: `renderEpic(snapshot)` exported from the entry point, byte-determinism proven, one-command local render for eyeballing, README documents usage.

**Test cases.**

- Integration (`src/render-epic.test.ts`): `renderEpic` on each fixture returns a document starting `<svg` and containing the ambient attribution — the full pipeline composes.
- Byte determinism: for both fixtures, `renderEpic(snapshot) === renderEpic(snapshot)` — strict string equality, run twice on separately loaded snapshots.
- Entry point: `src/index.ts` exports exactly `renderEpic` and `HistorySnapshot`.

**Components.**

```ts
// src/render-epic.ts
export function renderEpic(snapshot: HistorySnapshot): string;

// src/index.ts
export { renderEpic } from './render-epic.js';
export type { HistorySnapshot } from './history-snapshot.js';

// scripts/render-fixture-to-svg.ts — dev script, not public API
// usage: pnpm render-fixture <fixture-path> [output-path]
// default output: temp/<fixture-name>.svg (temp/ already gitignored)
```

`tsx` added as devDependency; package script `"render-fixture": "tsx scripts/render-fixture-to-svg.ts"`. README gains a usage section (API example + render-fixture loop) per the docs-track-behavior rule.

**Commit plan.**

1. `feat: compose renderEpic pipeline` — composition + integration/determinism tests + index exports.
2. `feat: add render-fixture script` — tsx devDependency + script; no library change.
3. `docs: document Stage 1 usage in README` — docs only.

**Done when.** Gate green; determinism test passes; `pnpm render-fixture test-fixtures/single-contribution-account.json` writes a playing SVG to `temp/`; manual checklist below executed.

**Manual checklist (stage done-when, not automatable).** Embed the rendered SVG in a real README on github.com and observe: replay plays through GitHub's camo proxy, ambient loops. Record the verified SVG's commit hash in this plan when done. Until then, "plays inside a GitHub README" is unverified.

## Out of scope

- Six remaining chapter rules, precedence/cap logic, number-spelling helper — Stage 2 (`detect-chapters.ts` and `narration/` grow there).
- Scenes per chapter type, replay-budget assertion, history-derived ambient — Stage 3.
- Fetching, handle resolution, snapshot capture — Stage 4.
- HTTP endpoint, caching, error cards ("no such legend", "still being written") — Stage 5.
- Final art style: current visuals are a placeholder rendition of the leading candidate (universe-from-first-commit). Restyle lands as a Stage 0 spec amendment plus a rendering-module-only change. **Open question owned by Stage 0.**

## Open questions

1. **Art style pending Stage 0.** Placeholder style ships in Phase 5; the style boundary (timeline contract) exists so the restyle touches only `src/rendering/`.
2. **Manual README verification mechanics.** Phase 6's checklist needs a real github.com README (scratch repo). Who hosts it and where is decided at execution time; the plan only requires the verified artifact's commit hash be recorded here.
