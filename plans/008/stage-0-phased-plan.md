# Stage 0 phased plan — data foundation and strengths engine

Phased implementation plan for [Stage 0 of the visual-system staged plan](stages.md#stage-0--data-foundation-and-strengths-engine): extend the GitHub snapshot with the fields the mural needs (forks, followers, PRs opened, issues opened) and add a deterministic strengths engine that scores each user's dimensions. Nothing visible changes — the live SVG is byte-identical after this stage. The data the whole mural depends on now exists and is inspectable.

## Goal

After all phases: `fetchGitHubSnapshot` returns a `HistorySnapshot` carrying `followerCount`, per-repo `forkCount`/`isFork`, and `pullRequestsOpenedCount`/`issuesOpenedCount` (nullable — search-derived). A search-API failure degrades to `null` on those two counts and never aborts or rate-limits the whole snapshot. A new pure `scoreStrengths(snapshot): StrengthsResult` ranks eight numeric dimensions by a continuous ladder-position `reach`, guarantees the user's own strongest dimension is always crowned (even below baseline), and derives a categorical `dominantLanguage`. An optional `GITHUB_TOKEN` raises the API rate ceiling without changing any output bytes. `renderEpic`, `renderEpicSvg`, and `handleImageRequest` are untouched. Generation stays deterministic and LLM-free.

## Context

The fetch layer is stable: `fetchGitHubSnapshot(handleInput, { transport, capturedAtDate })` (`src/github/fetch-github-snapshot.ts`) composes `fetchGitHubPublicProfile` (`src/github/github-rest-client.ts`, `GET /users/{login}` + paginated `/users/{login}/repos?type=owner`) and `fetchContributionCalendar` (`src/github/contribution-calendar.ts`, scrapes `github.com/users/{login}/contributions` HTML). A calendar rate-limit throws `ContributionCalendarRateLimitError`, caught at `fetch-github-snapshot.ts:57-63` and collapsed into a top-level `rate-limited` result because the calendar is load-bearing for the render. All HTTP goes through the injectable `HttpTransport` (`src/github/http-transport.ts`), whose `get(url, headers?)` already accepts a headers arg; `defaultHttpTransport` (`src/github/default-http-transport.ts`) is unauthenticated.

`HistorySnapshot` and `RepositorySummary` (`src/history-snapshot.ts`) have zero optional (`?`) fields — every absent value is a documented `| null` (`firstPublicActivityDate`, `RepositorySummary.lastPushedDate`). `stableHistorySnapshotJson` (`src/github/stable-history-snapshot-json.ts`) reconstructs every key in a fixed order for deterministic serialization; both fixtures (`test-fixtures/rich-history-account.json`, `examples/stage-2-phase-6/rich-history-account.json`) and the `capture-github-snapshot` script flow through it. `buildHistorySnapshot` (`src/test-support/build-history-snapshot.ts`) is the test factory.

The temporal-chapter engine (`src/chapters/`) already owns activity *shape* — streaks (`great-streak-chapter.ts`), silences (`dark-age-chapter.ts`), recency, milestones. The strengths engine owns activity *magnitude* only; the two never share a signal.

Determinism is the invariant the whole stage protects: same GitHub data → identical snapshot bytes and identical `StrengthsResult`. The auth token flips whether a count is *available*, never what the bytes are. Randomness stays seeded and render-only (`src/timeline/derive-seed-from-handle.ts`) — the strengths ranking uses no seed.

## Phases

## Phase 1 — Snapshot free fields (forks, followers, is-fork)

**Behavior delivered.** The snapshot gains three free fields available on payloads already fetched: `followerCount` from the user response, and per-repo `forkCount` (inbound `forks_count`) and `isFork` (the `fork` flag) from the repos response. Serialization order is pinned and both fixtures regenerate through the serializer. Render bytes and existing behavior are unchanged.

**Test cases.**

- `fetchGitHubPublicProfile` maps `followers` → `followerCount`, and each repo's `forks_count` → `forkCount` and `fork` → `isFork`. Level: unit (`FakeTransport`).
- `stableHistorySnapshotJson` serializes `forkCount` immediately after `starCount` in each repo, and (unchanged for now) keeps snapshot key order; a snapshot with the new fields round-trips key-for-key. Level: unit.
- `buildHistorySnapshot()` defaults include `followerCount: 0`, and `buildRepositorySummary`-shaped repos default `forkCount: 0`, `isFork: false`. Level: unit.
- Both committed fixtures parse into a `HistorySnapshot` carrying the new fields (regenerate-through-serializer, no hand editing). Level: unit / regen command.

**Components.**

```ts
// src/history-snapshot.ts
export type RepositorySummary = {
  name: string;
  createdDate: string;
  lastPushedDate: string | null;
  starCount: number;
  forkCount: number;   // inbound forks_count
  isFork: boolean;     // this repo is itself a fork of another
  primaryLanguage: string | null;
};

export type HistorySnapshot = {
  // ...existing fields...
  followerCount: number;
  repositories: RepositorySummary[];
};
```

```ts
// src/github/github-rest-client.ts — GitHubUserResponse gains `followers: number`;
// GitHubRepositoryResponse gains `forks_count: number`, `fork: boolean`;
// GitHubPublicProfile gains `followerCount`.
```

**Commit plan.**

1. `test: pin snapshot fork and follower fields` — Failing tests for rest-client mapping, serializer order, factory defaults, fixture round-trip. Hygiene: test-only.
2. `feat: add fork and follower fields to snapshot` — Extend types, rest-client mapping, serializer (order first), `buildHistorySnapshot` defaults, and regenerate both fixtures through the serializer. Hygiene: data-model only, render untouched.

**Done when.** The snapshot carries `followerCount`, `forkCount`, `isFork`; the serializer pins their order; both fixtures and the factory include them; render bytes unchanged.

## Phase 2 — Search-based opened counts and graceful degradation

**Behavior delivered.** A new module fetches the user's opened-PR and opened-issue totals via two `GET /search/issues` calls (`per_page=1`, read `total_count`), run together. It swallows its own failures: any non-200, rate-limit, or thrown error maps that count to `null`. `fetchGitHubSnapshot` calls it after profile+calendar succeed and assigns the two counts onto the snapshot; both `null` still returns `kind: 'success'`. Search never produces a top-level `rate-limited` result and never aborts the snapshot — the opposite of the calendar's collapse, because these counts are enrichment, not load-bearing.

**Test cases.**

- `fetchAuthoredCounts` issues `q=author:{login}+type:pr` and `q=author:{login}+type:issue` (`per_page=1`) and returns the two `total_count` values. Level: unit (`FakeTransport`).
- A 403/429/5xx or missing-body on either request → that count is `null`, the other still resolves. Level: unit.
- A thrown transport error inside the module → both counts `null`, no throw escapes. Level: unit.
- `fetchGitHubSnapshot` with search stubbed → snapshot carries non-null `pullRequestsOpenedCount`/`issuesOpenedCount`. Level: unit.
- `fetchGitHubSnapshot` with search failing → snapshot still `kind: 'success'` with both counts `null`; profile/calendar results unaffected. Level: unit.
- Existing `fetch-github-snapshot.test.ts` fakes (which don't stub the search URLs) keep passing with both counts `null` — no re-stubbing. Level: regression note.

**Components.**

```ts
// src/history-snapshot.ts — HistorySnapshot gains, after `repositories`:
//   pullRequestsOpenedCount: number | null;
//   issuesOpenedCount: number | null;
// null = search unavailable (dimension goes quiet). 0 = genuine zero.
```

```ts
// src/github/fetch-authored-counts.ts
import type { HttpTransport } from './http-transport.js';

export type AuthoredCounts = {
  pullRequestsOpenedCount: number | null;
  issuesOpenedCount: number | null;
};

export function fetchAuthoredCounts(
  login: string,
  transport: HttpTransport,
): Promise<AuthoredCounts>; // never rejects; failures → null fields
```

Serializer and factory extended for the two nullable counts (order: after `repositories`).

**Commit plan.**

1. `test: pin authored-counts fetch and degradation` — Failing tests for count parsing, per-request and whole-module degradation, and snapshot-stays-success. Hygiene: test-only.
2. `feat: add opened PR and issue counts with graceful degradation` — Implement `fetchAuthoredCounts`, wire into `fetchGitHubSnapshot`, extend snapshot type, serializer, factory. Hygiene: fetch + data-model, render untouched.

**Done when.** The snapshot carries the two opened counts; a search failure yields `null` counts with the snapshot still `success`; existing tests pass unchanged with null counts.

## Phase 3 — Host-scoped auth transport wrapper

**Behavior delivered.** A pure transport decorator adds `Authorization: Bearer <token>` to requests whose host is `api.github.com`, leaving the `github.com` calendar scrape unauthenticated. `scripts/serve.ts` builds it from `process.env.GITHUB_TOKEN` and passes it as the transport; when the env var is absent it is a transparent pass-through. Raising the API ceiling (60→5000 req/hr) makes the search and REST calls reliable; the token changes availability only, never output bytes, so determinism and caching hold.

**Test cases.**

- `githubApiTransport(token, inner)` forwarding an `api.github.com` URL merges `Authorization: Bearer <token>` into the headers passed to `inner.get`. Level: unit (fake inner transport).
- The same wrapper forwarding a `github.com` (calendar) URL adds no `Authorization` header. Level: unit.
- `githubApiTransport(undefined, inner)` forwards every call byte-for-byte unchanged (no header added on any host). Level: unit.
- Caller-supplied headers are preserved and merged, not dropped, when the token is added. Level: unit.

**Components.**

```ts
// src/github/github-api-transport.ts
import type { HttpTransport } from './http-transport.js';
import { defaultHttpTransport } from './default-http-transport.js';

export function githubApiTransport(
  token: string | undefined,
  inner?: HttpTransport, // defaults to defaultHttpTransport
): HttpTransport;
```

```ts
// scripts/serve.ts — transport = githubApiTransport(process.env.GITHUB_TOKEN)
```

**Commit plan.**

1. `test: pin host-scoped github auth transport` — Failing tests for header-on-api-host, no-header-on-calendar-host, no-token pass-through, header merge. Hygiene: test-only.
2. `feat: add host-scoped github auth transport` — Implement the wrapper and wire it into `serve.ts`. Hygiene: transport decorator + boot wiring only.

**Done when.** The wrapper authenticates `api.github.com` calls, leaves the calendar host untouched, is a pass-through without a token, and `serve.ts` reads `GITHUB_TOKEN`; no output bytes change.

## Phase 4 — Strengths scoring engine

**Behavior delivered.** A pure `scoreStrengths(snapshot): StrengthsResult` scores eight numeric dimensions, each mapped to an integer tier `0..4` via a fixed per-dimension threshold ladder and to a continuous `reach ∈ [0,1]` (fractional ladder position). `topDimension` is the argmax-`reach` over available dimensions — the relative guarantee that a user's own strongest dimension is always crowned, even entirely below baseline. Null-valued dimensions (unavailable PR/issue) are excluded from the ranking and listed under `unavailable`. A categorical `dominantLanguage` is derived over non-fork repos. The result is total (never null; `ranked` always ≥ 6 entries). Exported from `index.ts`. Nothing is wired into rendering.

Dimension definitions:

| dimension | raw value |
|---|---|
| `projectCount` | count of **non-fork** repos |
| `stars` | sum `starCount` over **all** repos |
| `forks` | sum `forkCount` over **all** repos |
| `followers` | `followerCount` |
| `pullRequests` | `pullRequestsOpenedCount` (null → unavailable) |
| `issues` | `issuesOpenedCount` (null → unavailable) |
| `languageBreadth` | distinct non-null `primaryLanguage` over **non-fork** repos |
| `activityVolume` | sum `contributionDays[].count` |

`stars`/`forks` sum over all repos (a fork you made has ~0 own stars and ~0 inbound forks, so no inflation). `projectCount`, `languageBreadth`, and `dominantLanguage` filter to non-fork repos so forks-of-others don't inflate authored-work signal.

`reach`: thresholds `[t1,t2,t3,t4]` (strictly positive, strictly ascending) map to band knots `[0, .25, .5, .75, 1]`; piecewise-linear interpolation of `rawValue` between knots; `raw` in `[0,t1]` interpolates into `(0, .25)`; `raw > t4` clamps to `1`. `tier` = band floor of `reach` (`0..4`). Tie-break on equal `reach`: a fixed canonical dimension-priority array (`stars, projectCount, languageBreadth` ahead of the softer dimensions); no handle seed.

`dominantLanguage`: most-frequent `primaryLanguage` over non-fork repos; `repoShare` denominator = non-fork repos with a non-null language; tie-break repo-count-desc → language of the highest-`starCount` repo → alphabetical.

**Test cases.**

- **Rich** profile → high `reach`/tier across several dimensions; `ranked` desc by `reach`; `topDimension` = `ranked[0]`. Level: unit.
- **Modest** (all sub-`t1`) profile → every `reach ∈ (0, .25)`, all `tier` 0, yet `topDimension` still resolves to the genuine strongest (feel-good guarantee). Level: unit.
- **Lopsided** fixtures — a star-heavy account crowns `stars`; a polyglot-heavy account crowns `languageBreadth`; per-spike cases where affordable each assert the correct crown. This is the **cross-dimension calibration guard** (see risk). Level: unit.
- **Zero-activity** (0 repos, 0 contributions, counts 0) → total result, six zero-`reach` entries, `topDimension` resolved via canonical tie-break, no throw. Level: unit.
- Null PR/issue counts → those dimensions absent from `ranked`, present in `unavailable`; never crowned. Level: unit.
- `reach` monotonic non-decreasing in `rawValue`; `raw > t4` clamps to `1`; each ladder is strictly positive and strictly ascending (asserted invariant). Level: unit.
- Fork repos excluded from `projectCount`/`languageBreadth`/`dominantLanguage`; included repos' stars/forks still summed. Level: unit.
- `dominantLanguage` tie resolves count-desc → highest-star language → alphabetical; `repoShare` denominator excludes null-language and fork repos. Level: unit.
- Determinism: same snapshot → identical `StrengthsResult` across runs (no seed, no clock). Level: unit.

**Components.**

```ts
// src/strengths/strength-dimensions.ts
export type StrengthDimension =
  | 'projectCount' | 'stars' | 'forks' | 'followers'
  | 'pullRequests' | 'issues' | 'languageBreadth' | 'activityVolume';

export const RANKING_TIE_BREAK_ORDER: readonly StrengthDimension[]; // canonical priority
```

```ts
// src/strengths/tier-thresholds.ts
export type TierThresholds = readonly [number, number, number, number]; // strictly ascending, > 0
export const DIMENSION_TIER_THRESHOLDS: Record<StrengthDimension, TierThresholds>;
```

```ts
// src/strengths/score-strengths.ts
import type { HistorySnapshot } from '../history-snapshot.js';

export type StrengthScore = {
  dimension: StrengthDimension;
  rawValue: number;
  tier: 0 | 1 | 2 | 3 | 4;
  reach: number; // [0,1]
};

export type StrengthsResult = {
  ranked: StrengthScore[];            // available dims, desc by reach, always ≥ 6
  topDimension: StrengthScore;        // = ranked[0]; carries reach
  unavailable: StrengthDimension[];   // null-valued dims (pr/issue on search failure)
  dominantLanguage: { name: string; repoShare: number } | null;
};

export function scoreStrengths(snapshot: HistorySnapshot): StrengthsResult;
```

`src/index.ts` gains: `export { scoreStrengths } from './strengths/score-strengths.js'` and `export type { StrengthsResult, StrengthScore, StrengthDimension }`.

**Commit plan.**

1. `test: pin strengths scoring across profile shapes` — Failing tests for rich/modest/lopsided/zero, null exclusion, reach/tier/tie-break, dominant-language, determinism. Hygiene: test-only.
2. `feat: add strengths scoring engine` — Implement dimensions, ladders, reach interpolation, ranking, dominant-language; export from `index.ts`. Hygiene: pure scoring, render/service untouched.

**Done when.** `scoreStrengths` scores all four profile shapes correctly, always crowns the genuine top dimension, excludes unavailable dimensions, is deterministic, and is exported — with no change to render or service paths.

## Phase 5 — Inspectability: stable strengths JSON and reader script

**Behavior delivered.** A stable, deterministic serializer for `StrengthsResult` (explicit key order, mirroring `stableHistorySnapshotJson`) and a standalone script that reads a captured snapshot JSON and emits the stable strengths JSON — offline, over the existing fixtures, with no live fetch. This makes the derived strengths data eyeball-able and re-scoreable when ladders are tuned. The strengths JSON is a separate file; it is never nested into the snapshot fixtures.

**Test cases.**

- `stableStrengthsJson(result)` emits keys in a fixed order and is byte-identical across repeated calls for the same result. Level: unit.
- The reader script, run over a committed snapshot fixture, produces the same stable strengths JSON deterministically (regenerate-and-diff). Level: integration / manual command recorded in PR.

**Components.**

```ts
// src/strengths/stable-strengths-json.ts
import type { StrengthsResult } from './score-strengths.js';
export function stableStrengthsJson(result: StrengthsResult): string;
```

```ts
// scripts/score-strengths.ts
// CLI: pnpm score-strengths <path-to-snapshot.json>
// Reads a captured HistorySnapshot JSON, runs scoreStrengths, writes stableStrengthsJson. No fetch.
```

`package.json` gains a `score-strengths` script.

**Commit plan.**

1. `test: pin stable strengths serialization` — Failing tests for stable key order and determinism. Hygiene: test-only.
2. `feat: add strengths inspection script and stable serializer` — Implement `stableStrengthsJson` and the reader script; add the package script. Hygiene: serialization + tooling only.

**Done when.** `stableStrengthsJson` is deterministic and the reader script emits inspectable strengths JSON offline over the fixtures.

## Named risks

- **Cross-dimension ladder calibration.** `reach` compares each dimension's fractional position on its *own* hand-tuned ladder, so the threshold constants themselves decide who gets crowned for a modest user — tier-2 on any dimension must feel comparably notable. This is unavoidable in any absolute-ladder scheme (star-magnitude and follower-magnitude have no common unit; the ladder *is* the mapping). Mitigation: calibrate the eight ladders against each other, and the **lopsided fixtures (Phase 4)** are the guard — each spiked profile asserts the correct dimension wins `topDimension`. Do not bury this in "tune constants later."

## Out of scope

- Any rendering of strengths — motifs, badge finale, world-scale composite (§6.3's 3-level camp/town/metropolis is a rendering input, deferred to Stage 1/2). Stage 0 emits only the per-dimension `0..4` tiers.
- Collaborator / contributed-to-others dimensions (excluded from the product).
- Streaks, silences, recency, and milestones — owned by the existing chapter engine, not strengths.
- Wiring `scoreStrengths` into `renderEpic`, `renderEpicSvg`, or `handleImageRequest` — the live SVG must stay byte-identical.
- A separate search-count cache — the existing `EpicCache` freshness gate (24h, keyed by lowercased handle) already caps the whole fetch, including both searches, at once per window.
- No LLM participates in fetching, scoring, serialization, or tooling.
