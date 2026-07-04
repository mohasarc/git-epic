# Stage 4 phased plan — live GitHub data

Phased implementation plan for [Stage 4 of the staged plan](../000/stages.md#stage-4--live-github-data): fetch logged-out-visible GitHub data for a real handle, shape it into `HistorySnapshot`, and capture live snapshots as deterministic fixtures.

## Goal

After all phases: a local caller can request a GitHub handle, get a distinct fetch outcome for success, nonexistent handle, organization handle, or rate limit, render the successful snapshot through the existing `renderEpic` pipeline, and capture that live snapshot to a fixture that re-renders byte-identically offline. The generated SVG remains deterministic and mechanical. No runtime LLM or generated prose enters the pipeline.

## Context

The current public boundary is pure: `renderEpic(snapshot: HistorySnapshot): string` in `src/render-epic.ts` consumes `HistorySnapshot` from `src/history-snapshot.ts`. Chapter detection, narration, timeline construction, seeded randomness, and SVG rendering already operate from that snapshot. Fixtures live under `test-fixtures/` and scripts render them through `scripts/render-fixture-to-svg.ts`.

Stage 4 adds the first impure boundary. The fetch layer should live outside the renderer, under a new `src/github/` ownership boundary, and return typed outcomes instead of throwing for expected GitHub states. It must use only data visible to a logged-out visitor. REST user and repo endpoints supply canonical login, account creation date, user-vs-org type, public repositories, stars, languages, and push dates. The contribution calendar comes from logged-out profile contribution markup, because authenticated GraphQL is outside this stage's no-auth constraint. All dates are normalized to UTC date-only strings before entering `HistorySnapshot`.

Visual note from the stage kickoff: this stage should not add explanatory text to the epic. Live data changes the existing visual story by feeding real activity into the current scenes. Examples should show the rendered image, not compensate with subtitles or prose inside the SVG.

## Phases

## Phase 1 — Add live fetch contracts and handle validation

**Behavior delivered.** The package has a typed live-data boundary that callers can depend on before any network code exists. GitHub handle input is validated and normalized for lookup, while canonical casing remains a property of a successful fetch result.

**Test cases.**

- `parseGitHubHandleInput` accepts valid GitHub login syntax case-insensitively, trims surrounding whitespace, and preserves the lookup spelling needed for HTTP calls. Level: unit.
- `parseGitHubHandleInput` rejects empty strings, repo paths, email-like values, leading/trailing hyphens, double hyphens, underscores, and handles over 39 characters. Level: unit.
- `FetchGitHubSnapshotResult` is exhaustively narrowed by a small test helper so future outcomes cannot be added without callsite updates. Level: type/unit.
- `index.ts` continues exporting only the existing runtime functions; live fetch contracts are type-only unless a later phase deliberately exports a runtime entry point. Level: unit.

**Components.**

```ts
// src/github/github-handle.ts
export type ParsedGitHubHandle = {
  lookup: string;
};

export type GitHubHandleParseResult =
  | { kind: 'valid'; handle: ParsedGitHubHandle }
  | { kind: 'invalid'; reason: 'empty' | 'syntax' };

export function parseGitHubHandleInput(input: string): GitHubHandleParseResult;
```

```ts
// src/github/fetch-github-snapshot-result.ts
import type { HistorySnapshot } from '../history-snapshot.js';

export type FetchGitHubSnapshotResult =
  | { kind: 'success'; snapshot: HistorySnapshot }
  | { kind: 'not-found'; handle: string }
  | { kind: 'organization'; handle: string }
  | { kind: 'rate-limited'; handle: string; retryAfterSeconds: number | null };
```

```ts
// src/github/http-transport.ts
export type HttpResponse = {
  status: number;
  headers: ReadonlyMap<string, string>;
  body: string;
};

export type HttpTransport = {
  get(url: string, headers?: Readonly<Record<string, string>>): Promise<HttpResponse>;
};
```

**Commit plan.**

1. `test: pin GitHub handle parsing contracts` — Adds failing unit tests for valid and invalid handle syntax. Hygiene: test-only.
2. `feat: add live fetch result contracts` — Adds the GitHub boundary types, handle parser, and transport type. Hygiene: type/API shape first, no network behavior.

**Done when.** Handle parsing behavior is pinned, expected live-fetch outcomes are named, and verification passes with no fetch implementation yet.

## Phase 2 — Fetch profile and repositories from public REST endpoints

**Behavior delivered.** A fake-transported GitHub client can resolve a real user shape into canonical login, account creation date, and public repository summaries, while detecting nonexistent handles, organization handles, and REST rate-limit exhaustion as distinct outcomes.

**Test cases.**

- A `200` user response with `type: "User"` and paginated repo responses returns a partial live source with canonical `login`, UTC account date, and repositories sorted by `createdDate`. Level: unit with fake transport.
- A `404` user response returns `not-found`. Level: unit.
- A `200` user response with `type: "Organization"` returns `organization` with canonical `login`. Level: unit.
- A `403` or `429` response with `x-ratelimit-remaining: 0` returns `rate-limited`, preserving `retry-after` when present. Level: unit.
- Repository fields map to `RepositorySummary`: `name`, `created_at` → `createdDate`, `pushed_at` → `lastPushedDate`, `stargazers_count` → `starCount`, and `language` → `primaryLanguage`. Level: unit.
- Pagination follows `Link: rel="next"` until exhausted, with a deterministic request order. Level: unit.

**Components.**

```ts
// src/github/github-rest-client.ts
import type { RepositorySummary } from '../history-snapshot.js';
import type { FetchGitHubSnapshotResult } from './fetch-github-snapshot-result.js';
import type { ParsedGitHubHandle } from './github-handle.js';
import type { HttpTransport } from './http-transport.js';

export type GitHubPublicProfile = {
  login: string;
  accountCreatedDate: string;
  repositories: RepositorySummary[];
};

export type FetchGitHubPublicProfileResult =
  | { kind: 'success'; profile: GitHubPublicProfile }
  | Exclude<FetchGitHubSnapshotResult, { kind: 'success' }>;

export type GitHubRestClientOptions = {
  transport: HttpTransport;
};

export function fetchGitHubPublicProfile(
  handle: ParsedGitHubHandle,
  options: GitHubRestClientOptions,
): Promise<FetchGitHubPublicProfileResult>;
```

```ts
// src/github/default-http-transport.ts
import type { HttpTransport } from './http-transport.js';

export const defaultHttpTransport: HttpTransport;
```

**Commit plan.**

1. `test: pin public profile REST outcomes` — Adds fake-transport tests for user, org, missing, and rate-limited user responses. Hygiene: test-only.
2. `feat: fetch public GitHub profile metadata` — Implements user lookup, outcome mapping, rate-limit detection, and UTC date normalization. Hygiene: one behavior boundary.
3. `test: pin public repository mapping` — Adds fake-transport tests for repo mapping, sorting, null push dates, and pagination. Hygiene: test-only.
4. `feat: collect public GitHub repositories` — Implements paginated repo fetching and `RepositorySummary` mapping. Hygiene: extends existing client without changing snapshot assembly.

**Done when.** The client resolves public profile/repo data without touching contributions or `HistorySnapshot` assembly, and all expected REST failure modes are typed outcomes.

## Phase 3 — Parse logged-out contribution data into a snapshot

**Behavior delivered.** The live fetch layer can assemble a complete `HistorySnapshot` from public profile/repo data plus logged-out contribution markup. Contribution days are normalized, sorted, and sparse. `firstPublicActivityDate` is derived from the earliest contribution day or public repository creation date.

**Test cases.**

- Contribution parser extracts date/count pairs from GitHub contribution markup fixtures, ignoring zero-count days and sorting ascending. Level: unit.
- Contribution parser handles GitHub's singular, plural, and "No contributions" aria-label text forms. Level: unit.
- Contribution fetching follows year links exposed by the profile contribution markup, requests each year deterministically, and de-duplicates overlapping days. Level: unit with fake transport.
- Snapshot assembly sets `capturedAtDate` from an injected UTC clock, never from `Date.now()` directly. Level: unit.
- Snapshot assembly derives `firstPublicActivityDate` from the minimum of contribution dates and repository creation dates, or `null` when both are empty. Level: unit.
- Successful `fetchGitHubSnapshot` returns canonical handle casing from GitHub and byte-stable JSON when serialized with the capture helper introduced in this phase. Level: unit.

**Components.**

```ts
// src/github/contribution-calendar.ts
import type { ContributionDay } from '../history-snapshot.js';
import type { ParsedGitHubHandle } from './github-handle.js';
import type { HttpTransport } from './http-transport.js';

export type ContributionCalendarFetchOptions = {
  transport: HttpTransport;
};

export function parseContributionCalendarHtml(html: string): ContributionDay[];

export function fetchContributionCalendar(
  handle: ParsedGitHubHandle,
  options: ContributionCalendarFetchOptions,
): Promise<ContributionDay[]>;
```

```ts
// src/github/fetch-github-snapshot.ts
import type { FetchGitHubSnapshotResult } from './fetch-github-snapshot-result.js';
import type { HttpTransport } from './http-transport.js';

export type FetchGitHubSnapshotOptions = {
  transport?: HttpTransport;
  capturedAtDate?: string;
};

export function fetchGitHubSnapshot(
  handleInput: string,
  options?: FetchGitHubSnapshotOptions,
): Promise<FetchGitHubSnapshotResult>;
```

```ts
// src/github/stable-history-snapshot-json.ts
import type { HistorySnapshot } from '../history-snapshot.js';

export function stableHistorySnapshotJson(snapshot: HistorySnapshot): string;
```

**Commit plan.**

1. `test: pin contribution calendar parsing` — Adds HTML fixture tests for contribution day extraction and zero-day omission. Hygiene: test-only.
2. `feat: parse public contribution calendars` — Implements the parser only, without network fetch. Hygiene: parser behavior only.
3. `test: pin contribution calendar fetching` — Adds fake-transport tests for year discovery, ordering, and de-duplication. Hygiene: test-only.
4. `feat: fetch public contribution calendars` — Implements logged-out contribution page fetching. Hygiene: network orchestration only.
5. `test: pin live snapshot assembly` — Adds snapshot assembly tests for canonical casing, `capturedAtDate`, and `firstPublicActivityDate`. Hygiene: test-only.
6. `feat: assemble GitHub history snapshots` — Implements `fetchGitHubSnapshot` and stable snapshot JSON serialization. Hygiene: integrates prior components.

**Done when.** A fake live account can flow through `fetchGitHubSnapshot` into the exact `HistorySnapshot` shape the renderer already consumes.

## Phase 4 — Add local live capture and render scripts

**Behavior delivered.** A developer can run one local command to capture a real GitHub handle into a fixture and another command to render a real handle directly to SVG. Expected GitHub outcomes print clear CLI messages and exit codes; successful renders are deterministic for the captured snapshot.

**Test cases.**

- Capture script writes stable JSON to the requested path for a successful fake fetch. Level: integration with a testable script helper.
- Capture script creates parent directories and refuses to overwrite an existing file unless `--force` is passed. Level: integration.
- Capture script exits distinctly for `not-found`, `organization`, and `rate-limited` outcomes, with exact messages. Level: integration.
- Render-live script writes SVG for a successful fake fetch and preserves the existing renderer's output for the same snapshot. Level: integration.
- Render-live script prints the same outcome messages as capture for expected non-success states. Level: integration.

**Components.**

```ts
// scripts/capture-github-snapshot.ts
// CLI:
//   pnpm capture-github-snapshot <handle> <output-json-path> [--force]
```

```ts
// scripts/render-github-handle-to-svg.ts
// CLI:
//   pnpm render-github-handle <handle> [output-svg-path]
```

```ts
// src/github/format-fetch-github-snapshot-result.ts
import type { FetchGitHubSnapshotResult } from './fetch-github-snapshot-result.js';

export type FormattedFetchOutcome = {
  exitCode: number;
  message: string;
};

export function formatFetchGitHubSnapshotResult(result: Exclude<FetchGitHubSnapshotResult, { kind: 'success' }>): FormattedFetchOutcome;
```

**Commit plan.**

1. `test: pin live snapshot CLI outcomes` — Adds tests around shared CLI helpers for successful writes and expected failure messages. Hygiene: test-only.
2. `feat: add live snapshot capture script` — Implements `capture-github-snapshot` and package script wiring. Hygiene: one CLI command.
3. `test: pin live render CLI output` — Adds tests proving a fake live fetch renders the same SVG as the captured snapshot. Hygiene: test-only.
4. `feat: add live handle render script` — Implements `render-github-handle` and package script wiring. Hygiene: second CLI command using existing helpers.

**Done when.** The local workflow exists without any HTTP server or cache policy, and expected upstream/user states are visible to CLI callers.

## Phase 5 — Capture a real fixture and document the live workflow

**Behavior delivered.** The repo contains one captured real-account snapshot fixture, a rendered SVG example from that fixture, and README/package docs showing how to capture and render a real handle locally. Re-rendering the captured fixture offline is byte-identical.

**Test cases.**

- Captured fixture validates as a `HistorySnapshot` and renders through existing fixture tests. Level: unit.
- Captured fixture renders byte-identically across separate loads. Level: unit.
- `pnpm render-fixture test-fixtures/<captured>.json examples/stage-4-live/<captured>.svg` produces the committed SVG bytes. Level: integration/manual command recorded in PR.
- Visual preview review checks that the live account output relies on scene motion and ambient history rather than added explanatory text. Level: manual preview artifact.

**Components.**

```text
test-fixtures/<real-handle>-captured.json
examples/stage-4-live/<real-handle>.svg
examples/stage-4-live/<real-handle>.scene.png
README.md
package.json
```

**Commit plan.**

1. `test: pin captured live fixture determinism` — Adds the captured fixture to existing deterministic render coverage. Hygiene: test-only plus fixture.
2. `docs: add live capture example artifacts` — Commits the rendered SVG/PNG preview and documents the local commands. Hygiene: docs/examples only.

**Done when.** A real handle can be captured locally, the captured snapshot re-renders offline with identical bytes, and the examples show the visual result without adding subtitle-like text to the SVG.

## Out of scope

- HTTP endpoint, caching, stale-cache fallback, and designed error cards belong to Stage 5.
- Generator page validation and preview UI belong to Stage 6.
- Authenticated GitHub APIs are out of scope; Stage 4 uses logged-out-visible data only.
- Organization and repo epics remain out of scope.
- No LLM participates in runtime fetching, snapshot shaping, narration, or rendering.
