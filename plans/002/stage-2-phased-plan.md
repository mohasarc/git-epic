# Stage 2 phased plan — full chapter catalog

Phased implementation plan for [Stage 2 of the staged plan](../000/stages.md#stage-2--full-chapter-catalog): all seven chapter rules with narrated captions. Behavior source of truth: [functional spec](../000/git-epic-functional-spec.md) §7, §8.1.

## Goal

After all phases: `detectChapters(snapshot)` returns the chronological, precedence-tie-broken, 8-capped chapter list for any history snapshot; `narrateChapter` covers every kind with a one-line epic-register caption; `renderEpic` replays every detected chapter (styleless placeholder scenes — Stage 3 draws them); `detectChapters`, `narrateChapter`, and `Chapter` are public API. Same fixture always yields the identical list and byte-identical SVG.

## Context

Stage 1 locked the pipeline: `HistorySnapshot → detectChapters (src/chapters/) → narrateChapter (src/narration/) → buildTimeline (src/timeline/) → renderEpicSvg (src/rendering/)`. Only `src/chapters/`, `src/narration/`, `src/history-snapshot.ts`, one switch in `src/rendering/render-epic-svg.ts`, `src/index.ts`, and test support change here; `timeline/` already handles N chapters. Verification gate per phase: `pnpm test && pnpm lint && pnpm typecheck`.

Both exhaustiveness switches (`narrateChapter`'s `never` guard at `src/narration/narrate-chapter.ts:22`, `chapterSceneVisual` at `src/rendering/render-epic-svg.ts:86`) break compile the moment the `Chapter` union widens — so each rule phase lands its variant type, detection, narration, and placeholder render case together.

Decisions this plan encodes (agreed in design dialogue):

- **Snapshot carries raw repo/contribution facts, no rule logic.** Two new required fields (shapes in Phase 1). Star-event timestamps judged unfetchable logged-out (stargazer pagination vs 60 req/h unauthenticated budget), so star chapters use creation-date attribution — **spec clarification** to record: 8.1 says "crosses"; we date by the created date of the repo that crossed (flagship) or whose addition crossed the running total (milestone). Milestone dates can drift earlier as older repos gain stars; accepted — determinism is per-snapshot (3.2), not per-user-forever.
- **Retraction-proof principle.** A chapter once shown never silently vanishes on regeneration. Hence: an ongoing ≥180-day silence fires (only grows); an incomplete calendar year never fires Prolificacy (pace can collapse). Future edge cases resolve against this rule.
- **One precedence list for both tie-break (§7) and drama cap (8.1)** — Origin, Flagship rise, Dark Age, Language era, Star milestone, Great Streak, Prolificacy. **Interpretation** to record: the spec names only one list.
- **Prolificacy zero-guard** — **spec clarification**: literal `total(Y) ≥ 2 × total(Y−1)` is degenerate at zero (fires on 0→0); we require `total(Y−1) > 0`. Suppresses a 0→N comeback year; that story belongs to Dark Age when the silence spanned 180+ days.
- **Total ordering.** Display key `(date asc, type precedence, intra-type key)`; intra-type: milestone threshold asc, flagship repoName asc; other kinds cannot collide on date within a type by construction. Cap selects 8 by `(precedence, date asc, intra-type key)` then re-sorts by display key. Null Origin date sorts first explicitly — comparator total regardless of snapshot invariants.
- **Visuals directive (from the human).** Captions stay one short line; chapter payloads carry the exact quantities so Stage 3 scenes show rather than tell. Stage 3 note: per-kind scene design should use generative-AI visual ideation, then implement the ideas in SMIL SVG — out of scope here.
- **Placeholder rendering.** Six explicit `case`s in `chapterSceneVisual` all returning one shared styleless visual; **no `default` arm** — the compile break on a new kind is the forcing function that makes Stage 3 draw every scene.
- **Spelling modes are two utils, not one.** Exact counts read "one hundred and forty" (spec Dark Age example); dramatic quantities read "a hundred" (spec flagship example). Conflating them contradicts the spec's own lines.
- **Boundary tests use a snapshot builder, not JSON-per-boundary.** JSON fixtures stay integration-tier.

Open questions: none — all decisions above are agreed; the three items marked spec clarification/interpretation await a spec amendment but do not block implementation.

## Phases

## Phase 1 — Snapshot fields, fixtures, builder, date arithmetic

**Behavior delivered.** The snapshot carries everything the six new rules consume; tests can build arbitrary histories in one expression; calendar-day arithmetic exists.

**Test cases.** (unit, colocated)

- `load-history-snapshot-fixture.test.ts` (extended): both grace-floor fixtures load with `contributionDays: []` and `repositories: []`.
- `build-history-snapshot.test.ts`: no overrides → a valid snapshot with empty `contributionDays`/`repositories`; overrides replace only the named fields.
- `difference-in-days.test.ts`: `('2020-01-01','2020-01-02') → 1`; same date → 0; month/year/leap-year boundaries (`'2020-02-28'→'2020-03-01' → 2`); multi-year span exact.

**Components.**

```ts
// src/history-snapshot.ts
export type ContributionDay = { date: string; count: number };

export type RepositorySummary = {
  name: string;
  createdDate: string;
  /** null = never pushed (empty repo). */
  lastPushedDate: string | null;
  starCount: number;
  primaryLanguage: string | null;
};

export type HistorySnapshot = {
  handle: string;
  accountCreatedDate: string;
  /** null for an account with zero public activity — implies contributionDays and
   *  repositories are empty (a public repo is public activity). Fetch layer contract. */
  firstPublicActivityDate: string | null;
  capturedAtDate: string;
  /** Days with ≥1 public contribution only, ascending by date. */
  contributionDays: ContributionDay[];
  /** Public repos, ascending by createdDate. */
  repositories: RepositorySummary[];
};

// src/test-support/build-history-snapshot.ts
export function buildHistorySnapshot(overrides?: Partial<HistorySnapshot>): HistorySnapshot;

// src/dates/difference-in-days.ts — plain calendar diff, Date.UTC on YYYY-MM-DD
export function differenceInDays(earlierDate: string, laterDate: string): number;
```

Rules express intent locally: gap length = `differenceInDays(a, b) - 1`, streak adjacency = `differenceInDays(a, b) === 1`. The util itself stays the obvious calendar diff.

**Commit plan.**

1. `feat: add contribution and repository fields to HistorySnapshot` — types + doc-comment invariant on `firstPublicActivityDate`; no callsites yet (type-only).
2. `test: expect empty history fields in grace-floor fixtures` — extend loader tests (red: fixtures lack the fields).
3. `feat: add empty history fields to grace-floor fixtures` — makes loader tests green (data-only).
4. `test: add history snapshot builder tests` — red, builder missing.
5. `feat: add history snapshot builder` — test-support only.
6. `test: add calendar day difference tests` — red, util missing.
7. `feat: add differenceInDays date utility` — makes tests green.

**Done when.** Tests green; existing pipeline output unchanged (new fields unread).

## Phase 2 — Number spelling

**Behavior delivered.** Narration can spell exact counts ("one hundred and forty") and dramatic quantities ("a hundred", "twelve thousand").

**Test cases.** (unit, colocated in `src/narration/`)

- `spell-exact-count.test.ts`: 1 → "one"; 30 → "thirty"; 140 → "one hundred and forty"; 179/180 boundary pair; 9999 → "nine thousand nine hundred and ninety-nine". Register: "and" before final tens/units, hyphenated 21–99.
- `spell-dramatic-quantity.test.ts`: 100 → "a hundred"; 350 → "three hundred" (round down); 999 → "nine hundred"; 1000 → "a thousand"; 12345 → "twelve thousand"; 100000 → "a hundred thousand"; 400000 → "four hundred thousand". Leading-unit articles: "a hundred"/"a thousand", never "one hundred stars".

**Components.**

```ts
// src/narration/spell-exact-count.ts — exact British-register spelling, 1..99999
export function spellExactCount(count: number): string;

// src/narration/spell-dramatic-quantity.ts — rounds DOWN to the leading dramatic
// unit (hundreds below 1000, thousands to 99999, hundred-thousands above), then spells
export function spellDramaticQuantity(count: number): string;
```

**Commit plan.**

1. `test: add exact count spelling tests` — red.
2. `feat: add exact count spelling` — green.
3. `test: add dramatic quantity spelling tests` — red.
4. `feat: add dramatic quantity spelling` — green.

**Done when.** Tests green; no production callsites yet.

## Phase 3 — Contribution-calendar rules: Dark Age, Great Streak, Prolificacy

**Behavior delivered.** The three `contributionDays`-driven chapters detect, narrate, and replay (placeholder scene) end to end.

**Test cases.** (unit, colocated per rule; all built with `buildHistorySnapshot`)

- `dark-age-chapter.test.ts`:
  - Interior gap of 179 strictly-between days → no chapter; 180 → fires. Gap length = `differenceInDays − 1`.
  - Trailing gap (last contribution → `capturedAtDate`, capture day excluded) ≥180 → fires with `endDate: null`.
  - Leading gap (account creation → first contribution) never fires.
  - Zero `contributionDays` → no chapters (all silence is leading silence).
  - Single contribution day with ≥180-day trailing gap → fires.
  - Two qualifying gaps → two chapters; payload dates: `date` = day after last contribution before the gap, `endDate` = day before the return contribution.
- `great-streak-chapter.test.ts`:
  - 29 consecutive days → nothing; 30 → fires.
  - Two streaks, longest wins; two equal-longest → earliest wins; always exactly 0 or 1 chapter.
  - Payload: `date` = streak start, `endDate` = streak end, `lengthDays` = inclusive day count.
- `prolificacy-chapter.test.ts`:
  - `total(Y) = 2×total(Y−1)` → fires; one less → nothing.
  - `total(Y−1) = 0` → never fires (zero-guard).
  - Year of `capturedAtDate` → never fires (incomplete year), even at 10× pace.
  - Y−1 is the immediate prior calendar year, not the last active year.
  - Two qualifying years → two chapters; payload `{ year, contributionCount, priorYearContributionCount }`, dated `Y-01-01`.
- `narrate-chapter.test.ts` (extended, exact full strings):
  - Ended Dark Age: `Then came the Dark Age: one hundred and eighty days, and not a single commit.`
  - Ongoing Dark Age: `Then fell the Dark Age: two hundred days without a commit, and the silence endures.`
  - Great Streak: `Then began the relentless campaign: thirty days of unbroken toil.`
  - Prolificacy: `Then came the year of abundance: the labors of 2024 doubled those of the year before.` (year in digits, no numerals otherwise)
- `render-epic.test.ts` (extended): snapshot firing a Dark Age renders an SVG containing its narration caption; still byte-identical across two renders.

**Components.**

```ts
// src/chapters/chapter.ts — each variant's date is its sort date
export type DarkAgeChapter = {
  kind: 'dark-age';
  /** Silence start: day after the last contribution before the gap. */
  date: string;
  /** Day before the return contribution; null = ongoing at capture. */
  endDate: string | null;
  /** Days strictly inside the gap. */
  lengthDays: number;
};

export type GreatStreakChapter = {
  kind: 'great-streak';
  date: string;
  endDate: string;
  lengthDays: number;
};

export type ProlificacyChapter = {
  kind: 'prolificacy';
  /** Y-01-01. */
  date: string;
  year: number;
  contributionCount: number;
  priorYearContributionCount: number;
};

export type Chapter = OriginChapter | DarkAgeChapter | GreatStreakChapter | ProlificacyChapter;

// src/chapters/dark-age-chapter.ts
export const DARK_AGE_THRESHOLD_DAYS = 180;
export function detectDarkAgeChapters(snapshot: HistorySnapshot): DarkAgeChapter[];

// src/chapters/great-streak-chapter.ts
export const GREAT_STREAK_THRESHOLD_DAYS = 30;
export function detectGreatStreakChapters(snapshot: HistorySnapshot): GreatStreakChapter[];

// src/chapters/prolificacy-chapter.ts
export function detectProlificacyChapters(snapshot: HistorySnapshot): ProlificacyChapter[];
```

Singular rules still return arrays — uniform concat in `detectChapters`. Each detection function wires into `detectChapters` as it lands (plain concat after origin; global ordering is Phase 5). Narration adds `narrateDarkAgeChapter` / `narrateGreatStreakChapter` / `narrateProlificacyChapter` cases; rendering adds a shared `placeholderSceneVisual(): string` (dim `glowCircle` stack, deliberately styleless) with one explicit `case` per new kind — no `default`.

**Commit plan.**

1. `feat: add contribution-calendar chapter types` — three variant types + union widening deferred: types only, **not** yet in `Chapter` (type-only, keeps switches compiling).
2. `test: add dark age detection tests` — red.
3. `feat: detect dark age chapters` — green; standalone module, unwired.
4. `test: add great streak detection tests` — red.
5. `feat: detect great streak chapters` — green; unwired.
6. `test: add prolificacy detection tests` — red.
7. `feat: detect prolificacy chapters` — green; unwired.
8. `test: add narration cases for contribution-calendar chapters` — extends narration tests (red once union widens; committed with 9 if the intermediate red is uninformative).
9. `feat: narrate and replay contribution-calendar chapters` — widens `Chapter`, adds narration cases, `placeholderSceneVisual` + three render cases, wires the three detectors into `detectChapters`. One logical change: the union widening and every switch it forces.

**Done when.** Tests green; render-fixture script on a dark-age snapshot shows the caption in the replay.

## Phase 4 — Repository rules: Flagship rise, Star milestone, Language era

**Behavior delivered.** The three `repositories`-driven chapters detect, narrate, and replay (placeholder scene).

**Test cases.** (unit, colocated per rule)

- `flagship-rise-chapter.test.ts`:
  - 99 stars → nothing; 100 → fires, dated at `createdDate`, payload `{ repoName, starCount }`.
  - Two flagships → two chapters. Empty `repositories` → nothing.
- `star-milestone-chapter.test.ts`:
  - Running sum in `(createdDate, name)` order; total exactly 1000 → fires 100 and 1000 (cumulative ≥ threshold).
  - Crossing repo determines `date`; same-`createdDate` repos summed in name order (deterministic crossing).
  - Single 10k-star repo → three milestones, one date.
  - Total 99 → nothing.
- `language-era-chapter.test.ts`:
  - Repo active in year Y when `[createdDate, lastPushedDate]` overlaps Y and `primaryLanguage` non-null; `lastPushedDate: null` → never active.
  - Dominant = language of most active repos; tie keeps the incumbent (no chapter); tie with no incumbent → alphabetical first.
  - Years with no language-bearing repos are transparent — dominant carries forward, re-emergence with same language fires nothing.
  - Baseline (first year with a dominant) fires nothing; each later dominant change fires `{ year, fromLanguage, toLanguage }` dated `Y-01-01`.
  - Empty `repositories` → nothing.
- `narrate-chapter.test.ts` (extended, exact full strings):
  - Flagship: `And lo, symnav rose from nothing, and a hundred stars gathered to witness it.` (dramatic rounding: 350-star repo reads "three hundred stars")
  - Milestone: `And renown gathered upon the developer: a thousand stars in all.` — three fixed threshold strings ("a hundred" / "a thousand" / "ten thousand"), never computed.
  - Language era: `In the year 2021, the developer forsook JavaScript, and there was much refactoring.` — from-only; the destination language stays in the payload for Stage 3 to show.

**Components.**

```ts
// src/chapters/chapter.ts (additions)
export type FlagshipRiseChapter = {
  kind: 'flagship-rise';
  /** Degraded dating: the repo's createdDate (see plan header, spec clarification). */
  date: string;
  repoName: string;
  starCount: number;
};

export type StarMilestoneChapter = {
  kind: 'star-milestone';
  /** createdDate of the repo whose addition crossed the threshold. */
  date: string;
  threshold: 100 | 1000 | 10000;
};

export type LanguageEraChapter = {
  kind: 'language-era';
  /** Y-01-01. */
  date: string;
  year: number;
  fromLanguage: string;
  toLanguage: string;
};

export type Chapter = /* previous four */ | FlagshipRiseChapter | StarMilestoneChapter | LanguageEraChapter;

// src/chapters/flagship-rise-chapter.ts
export const FLAGSHIP_THRESHOLD_STARS = 100;
export function detectFlagshipRiseChapters(snapshot: HistorySnapshot): FlagshipRiseChapter[];

// src/chapters/star-milestone-chapter.ts
export const STAR_MILESTONE_THRESHOLDS = [100, 1000, 10000] as const;
export function detectStarMilestoneChapters(snapshot: HistorySnapshot): StarMilestoneChapter[];

// src/chapters/language-era-chapter.ts
export function detectLanguageEraChapters(snapshot: HistorySnapshot): LanguageEraChapter[];
```

Same wiring pattern as Phase 3: detectors standalone first, then one union-widening commit carrying narration cases, three render cases, and `detectChapters` concat.

**Commit plan.**

1. `feat: add repository chapter types` — type-only, not yet in the union.
2. `test: add flagship rise detection tests` — red.
3. `feat: detect flagship rise chapters` — green; unwired.
4. `test: add star milestone detection tests` — red.
5. `feat: detect star milestone chapters` — green; unwired.
6. `test: add language era detection tests` — red.
7. `feat: detect language era chapters` — green; unwired.
8. `test: add narration cases for repository chapters` — red with 9 as in Phase 3.
9. `feat: narrate and replay repository chapters` — union widening + narration cases + render cases + wiring.

**Done when.** Tests green; all seven kinds detectable and narrated.

## Phase 5 — Ordering, tie-break, cap

**Behavior delivered.** `detectChapters` returns the spec's chronological, precedence-tie-broken, 8-capped list instead of concat order.

**Test cases.** (unit)

- `order-chapters.test.ts`:
  - Date ascending is the primary display key; null Origin date sorts first (comparator total even for snapshots violating the null-invariant).
  - Same-date, different-type → precedence order (fixture: Language era + Prolificacy for the same year → Language era first).
  - Same-date, same-type → intra-type key (single 10k repo: flagship, then milestones 100 → 1000 → 10000).
  - Cap: >8 chapters → survivors chosen by `(precedence, date asc, intra-type)`, then re-sorted by display key; Origin always survives; cut falling between two same-date flagships resolved by repoName.
- `detect-chapters.test.ts` (extended): built snapshot firing >8 chapters → exactly 8, in display order; called twice → deeply identical (purity smoke test — the determinism proof stays the byte-identical SVG test).

**Components.**

```ts
// src/chapters/chapter.ts (addition)
export const CHAPTER_TYPE_PRECEDENCE: readonly Chapter['kind'][] = [
  'origin', 'flagship-rise', 'dark-age', 'language-era',
  'star-milestone', 'great-streak', 'prolificacy',
];

// src/chapters/order-chapters.ts
export const MAX_CHAPTERS = 8;
export function sortChaptersForDisplay(chapters: Chapter[]): Chapter[];
export function capChaptersByDrama(chapters: Chapter[]): Chapter[];
```

`detectChapters` becomes: concat rule outputs → `capChaptersByDrama` → `sortChaptersForDisplay` (cap internally orders by drama key; display sort last). Small named functions, no long body.

**Commit plan.**

1. `feat: add chapter type precedence list` — constant only, no callsites.
2. `test: add chapter ordering and cap tests` — red.
3. `feat: order and cap detected chapters` — `order-chapters.ts` + `detectChapters` wiring, green.

**Done when.** Tests green; overflow snapshot yields exactly the asserted 8 in display order.

## Phase 6 — Integration fixtures, public API, docs

**Behavior delivered.** The stage's Done-when: a rich fixture produces exactly the spec's precedence-ordered capped narrated list; determinism holds end to end; the list is callable by library consumers; docs show it.

**Test cases.**

- `detect-chapters.test.ts` (integration): `rich-history-account.json` → the exact expected 8-chapter list (all seven kinds present — one of each plus a second star milestone — so the cap boundary is exercised as a no-op) with exact narration strings.
- `detect-chapters.test.ts` (integration): `fifteen-year-overflow.json` (15-year history, >8 fired) → asserts precisely which 8 survive and their display order.
- `render-epic.test.ts` (extended): rich fixture renders byte-identically twice; SVG contains every surviving chapter's narration.
- Loader test: new fixtures load.

**Components.**

```ts
// src/index.ts (additions — payload shapes become public API here)
export { detectChapters } from './chapters/detect-chapters.js';
export { narrateChapter } from './narration/narrate-chapter.js';
export type { Chapter } from './chapters/chapter.js';
```

Fixtures: `test-fixtures/rich-history-account.json` (fires all seven rules, exactly 8 chapters), `test-fixtures/fifteen-year-overflow.json`. README gains Stage 2 usage (detect + narrate against a fixture); render-fixture script run against the rich fixture for the eyeball example under `examples/`.

**Commit plan.**

1. `test: add rich history and overflow fixtures with integration tests` — fixtures + red assertions on the exact lists.
2. `feat: pass full-catalog integration` — any residual wiring the integration surfaces (may be empty; if all green already, fold 1's tests green into one commit).
3. `feat: export chapter detection and narration` — `src/index.ts` additions only.
4. `docs: document Stage 2 usage in README` — usage snippet + refreshed example output.

**Done when.** `pnpm test && pnpm lint && pnpm typecheck` green; render-fixture script output for the rich fixture shows an 8-scene replay with all narrations; regenerating is byte-identical.

## Out of scope

- **Per-kind visual scenes** — Stage 3, which should generate visual ideas with a generative-AI tool and implement them in SMIL SVG (human directive); Stage 2's placeholder + no-`default` switch forces that work at compile time.
- **Fetching any of the new snapshot fields from GitHub** — Stage 4 (the `firstPublicActivityDate` null-invariant and field shapes are its contract).
- **Spec amendment text** for the three recorded clarifications (degraded star dating, prolificacy zero-guard, single precedence list) — landed alongside this plan's PR review, not by library code.
- **Replay timing changes** — `buildTimeline` already handles up to 8 chapters within budget (Stage 1 arithmetic).
