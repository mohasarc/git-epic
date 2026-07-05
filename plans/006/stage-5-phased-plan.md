# Stage 5 phased plan — image endpoint service

Phased implementation plan for [Stage 5 of the staged plan](../000/stages.md#stage-5--image-endpoint-service): serve every request to `/<handle>.svg` a renderable SVG — the epic, the "no such legend" card, or the "still being written" placeholder — with the spec's freshness and staleness behavior, deployable to a reachable host.

## Goal

After all phases: an unauthenticated `GET /<handle>.svg` returns HTTP 200 with an animated SVG for every input. A fresh cached epic (< 24h) is served without a fetch; a stale-or-missing epic triggers a live fetch, renders through the existing `renderEpic` pipeline, and caches the result; a definitive not-found or organization handle renders the "no such legend" card; an upstream outage or rate limit serves the most recent cached epic if one exists, otherwise the "still being written" placeholder. Every response is identical for all viewers within the freshness window. The service is deployable as a single Node origin. No runtime LLM; generation stays mechanical and deterministic.

## Context

The pure core is stable: `renderEpic(snapshot: HistorySnapshot): string` (`src/render-epic.ts`) and the fetch layer `fetchGitHubSnapshot(handleInput, { transport, capturedAtDate }): Promise<FetchGitHubSnapshotResult>` (`src/github/fetch-github-snapshot.ts`), which returns a discriminated union `success | not-found | organization | rate-limited`. Handle parsing (`parseGitHubHandleInput`, `src/github/github-handle.ts`) already normalizes and rejects invalid syntax. `github-rest-client.ts` returns `not-found` only on HTTP 404 and `organization` only on `type: 'Organization'`; it has no 5xx/network branch, so those propagate as thrown errors. Rendering primitives live in `src/rendering` (`PALETTE`/`TYPOGRAPHY` in `visual-vocabulary.ts`, `centeredText`/`fadingRule`/`ornamentDot`/`CANVAS_WIDTH`/`CANVAS_HEIGHT` in `scene-primitives.ts`); the credit line constant is `src/timeline/attribution.ts`. Embed-safety is asserted by `src/test-support/expect-embed-safe-svg.ts`. Tests use a `FakeTransport` (`src/github/github-rest-client.test.ts`).

Stage 5 composes those pure parts behind the first HTTP surface. The request logic stays a pure, framework-agnostic function with injected dependencies (`transport`, a cache port, and `nowIso` as a UTC ISO instant string), tested hermetically exactly like the core. A thin Node `http.createServer` bridge and boot script host it. The package's library boundary (`index.ts` exports, `files: [dist]`) is unchanged — the service is an app, not library API.

Determinism and no-broken-image are the two invariants the whole stage protects: every `.svg` request returns 200 with a valid, embed-safe SVG regardless of upstream state, and two requests within the freshness window return byte-identical documents.

## Phases

## Phase 1 — Error-card render surfaces

**Behavior delivered.** Two pure card renderers produce full 830×415 dark SVGs in the chosen art style: "no such legend" (for nonexistent/organization/invalid handles) and "the epic is still being written" (for upstream unavailable with no cache). Both read as the same universe as the epic — reused starfield, palette, caption treatment — with slow ambient twinkle, no replay. Both are embed-safe and byte-deterministic.

**Test cases.**

- `renderNoSuchLegendCard` returns an SVG whose primary line is the canonical "No such legend" and whose second line names the requested handle in the epic register. Level: unit.
- `renderNoSuchLegendCard` escapes an XML-hostile handle (`<`, `&`, `"`) so the body stays embed-safe. Level: unit.
- `renderStillBeingWrittenCard` returns an SVG whose primary line is "The epic is still being written" and second line asks the viewer to return shortly. Level: unit.
- Both cards carry the `CREDIT_LINE` from `attribution.ts`, rendered with the ambient treatment (centered, y=391, fontSize 13, `PALETTE.dimText`), and carry no "The Epic of &lt;handle&gt;" title. Level: unit.
- Both cards render byte-identically across repeated calls (no-such-legend seeded via `deriveSeedFromHandle(handle)`; still-being-written uses a fixed literal seed). Level: unit.
- Both cards pass `expectEmbedSafeSvg` (no script, no external ref, no event handler) and contain a `repeatCount="indefinite"` twinkle animation. Level: unit.

**Components.**

```ts
// src/rendering/cards/no-such-legend-card.ts
export function renderNoSuchLegendCard(requestedHandle: string): string;
```

```ts
// src/rendering/cards/still-being-written-card.ts
export function renderStillBeingWrittenCard(): string;
```

**Commit plan.**

1. `test: pin error card render surfaces` — Adds failing tests for card copy, credit line, handle escaping, determinism, embed-safety. Hygiene: test-only.
2. `feat: render no-such-legend and still-being-written cards` — Implements both card renderers reusing existing rendering primitives. Hygiene: pure rendering, no service wiring.

**Done when.** Both cards render deterministically, carry the credit line, escape untrusted input, and pass embed-safety — with no HTTP or cache code yet.

## Phase 2 — Cache port and freshness math

**Behavior delivered.** An `EpicCache` port stores rendered epic documents keyed by lowercased handle, with a bounded in-memory default adapter (LRU by entry count, guarding OOM from guessable-URL handle spraying). Freshness helpers derive the 24-hour boundary and the epic `Cache-Control` max-age from injected ISO instants.

**Test cases.**

- `createInMemoryEpicCache` stores and retrieves an entry by key; `get` returns `null` for an unknown key. Level: unit.
- `createInMemoryEpicCache(maxEntries)` evicts the least-recently-used entry once the cap is exceeded, and a `get` counts as a use. Level: unit.
- `freshnessAgeMs(nowIso, renderedAtIso)` returns `Date.parse(nowIso) - Date.parse(renderedAtIso)`; an entry is fresh iff age < 86_400_000. Level: unit.
- `epicCacheControlSeconds(ageMs)` returns `min(86400, max(300, 86400 - floor(ageMs/1000)))`, including both clamps (age 0 → 86400; negative age → 86400; 20h age → ~14400). Level: unit.

**Components.**

```ts
// src/service/epic-cache.ts
export type EpicCacheEntry = { document: string; renderedAtIso: string };

export interface EpicCache {
  get(handleKey: string): Promise<EpicCacheEntry | null>;
  set(handleKey: string, entry: EpicCacheEntry): Promise<void>;
}
```

```ts
// src/service/in-memory-epic-cache.ts
import type { EpicCache } from './epic-cache.js';

export function createInMemoryEpicCache(maxEntries?: number): EpicCache;
```

```ts
// src/service/epic-freshness.ts
export const EPIC_FRESHNESS_MS: number; // 86_400_000

export function freshnessAgeMs(nowIso: string, renderedAtIso: string): number;
export function isEpicFresh(nowIso: string, renderedAtIso: string): boolean;
export function epicCacheControlSeconds(ageMs: number): number;
```

**Commit plan.**

1. `test: pin epic cache port and freshness math` — Adds failing tests for the bounded LRU adapter and freshness/max-age arithmetic. Hygiene: test-only.
2. `feat: add epic cache port and freshness helpers` — Implements the in-memory bounded adapter and freshness math. Hygiene: pure data structures, no fetch/render.

**Done when.** The cache round-trips entries, evicts past its bound, and freshness/max-age math matches the spec's 24-hour window with clamps — no handler yet.

## Phase 3 — Image request handler (state machine)

**Behavior delivered.** A pure `handleImageRequest(requestedHandle, { transport, cache, nowIso })` composes cache, fetch, render, and cards into the full freshness/staleness state machine. Every outcome returns HTTP 200 with `Content-Type: image/svg+xml; charset=utf-8` and a state-appropriate `Cache-Control`. It always passes `capturedAtDate: nowIso.slice(0,10)`, so no clock is sampled inside.

**Test cases.** (unit, `FakeTransport` + `createInMemoryEpicCache` + frozen `nowIso`)

- Invalid handle syntax → no-such-legend card, 200, no cache read, no fetch. Level: unit.
- Fresh cached entry (age < 24h) → serves stored document, no fetch; `cache.set` not called. Level: unit.
- Stale entry + successful fetch → renders, calls `cache.set` with a new `renderedAtIso`, serves the new document. Level: unit.
- No entry + successful fetch → renders, caches, serves. Level: unit.
- not-found → no-such-legend card; `cache.set` not called. Level: unit.
- organization → no-such-legend card; `cache.set` not called. Level: unit.
- not-found **with a stale entry present** → still the no-such-legend card, not the stale epic (definitive negative, not "upstream unavailable"). Level: unit.
- rate-limited, no entry → still-being-written placeholder; `cache.set` not called. Level: unit.
- thrown transport error, no entry → still-being-written placeholder; `cache.set` not called. Level: unit.
- rate-limited **with a stale entry** → serves the stale document. Level: unit.
- thrown transport error **with a stale entry** → serves the stale document. Level: unit.
- `Cache-Control` per state: epic fresh hit at a known age → exact `max-age = 86400 - floor(ageMs/1000)` (with clamps); cards / placeholder / stale-epic → `max-age=300`; all `public`. Level: unit.
- Case-collapse: `MoHa` and `moha` resolve to the same cache key/entry. Level: unit.
- Two in-window requests → byte-identical document; `cache.set` called exactly once across both. Level: unit.
- Hostile requested handle routed through the not-found path → body stays embed-safe. Level: unit.

**Components.**

```ts
// src/service/image-response.ts
export type ImageResponse = {
  status: number;
  headers: Record<string, string>;
  body: string;
};
```

```ts
// src/service/handle-image-request.ts
import type { HttpTransport } from '../github/http-transport.js';
import type { EpicCache } from './epic-cache.js';
import type { ImageResponse } from './image-response.js';

export type ImageRequestDependencies = {
  transport: HttpTransport;
  cache: EpicCache;
  nowIso: string; // UTC (Z-suffixed) ISO instant
};

export function handleImageRequest(
  requestedHandle: string,
  deps: ImageRequestDependencies,
): Promise<ImageResponse>;
```

**Commit plan.**

1. `test: pin image request state machine` — Adds failing tests for every fresh/stale/negative/unavailable branch, Cache-Control math, case-collapse, no-write assertions, and byte-identity. Hygiene: test-only.
2. `feat: add image request handler` — Implements the state machine composing cache, fetch (try/catch → unavailable), render, and cards. Hygiene: one pure handler, no HTTP.

**Done when.** Every state-machine branch returns the correct 200 image response and header set from injected fakes, with no negative cache and no write on non-success outcomes.

## Phase 4 — HTTP bridge, routing, and server boot

**Behavior delivered.** A Node bridge parses `req.method`/`req.url` and delegates to the handler: strips the query string, requires a `.svg` path, percent-decodes and strips `.svg` to the requested handle. Non-`.svg` paths → 404 plain text; non-GET (except HEAD) → 405 with `Allow: GET`; HEAD → handler headers with no body. A top-level catch returns the still-being-written placeholder at 200 so no unexpected throw ever renders a broken image. `scripts/serve.ts` binds it to `http.createServer` reading `PORT`, computing `nowIso` per request.

**Test cases.** (unit, fake handler deps)

- `GET /octocat.svg` → delegates to the handler; response status/headers/body pass through. Level: unit.
- Query string ignored: `GET /octocat.svg?foo=bar&cachebust=1` resolves the same handle. Level: unit.
- Percent-decoded path: `GET /oct%6fcat.svg` resolves `octocat`. Level: unit.
- Non-`.svg` path (`/`, `/octocat`) → 404 plain text. Level: unit.
- Non-GET method (POST/PUT) → 405 with `Allow: GET`. Level: unit.
- HEAD `/octocat.svg` → same status and headers as GET, empty body. Level: unit.
- A handler that throws → bridge returns still-being-written placeholder at 200 (never a 500). Level: unit.

**Components.**

```ts
// src/service/route-service-request.ts
import type { ImageRequestDependencies } from './handle-image-request.js';
import type { ImageResponse } from './image-response.js';

export type ServiceRequest = { method: string | undefined; url: string | undefined };

export function routeServiceRequest(
  request: ServiceRequest,
  deps: ImageRequestDependencies,
): Promise<ImageResponse>;
```

```ts
// scripts/serve.ts
// CLI: pnpm start   (reads PORT env, default 8080)
// Binds http.createServer -> routeServiceRequest, nowIso = new Date().toISOString() per request.
```

**Commit plan.**

1. `test: pin service routing and method handling` — Adds failing tests for query stripping, percent-decode, 404/405/HEAD, and the top-level placeholder catch. Hygiene: test-only.
2. `feat: add http bridge and routing` — Implements `routeServiceRequest`. Hygiene: routing only, delegates to Phase 3 handler.
3. `feat: add server boot script` — Adds `scripts/serve.ts`, `PORT` handling, and the `start` package script. Hygiene: thin boot, no logic.

**Done when.** The bridge routes methods and paths correctly, HEAD and the top-level catch hold the never-a-broken-image invariant, and `pnpm start` serves locally.

## Phase 5 — Deploy config, examples, and docs

**Behavior delivered.** The service is deploy-ready as a single Node origin: a `Dockerfile` and `fly.toml` pinning one instance (in-memory cache is correct only on a single instance). `examples/stage-5/` carries the two rendered cards; the README documents the image endpoint and how to run/deploy the server. The actual deploy and placeholder-domain provisioning are recorded as an open question — they need a Fly account and credentials unavailable in this environment.

**Test cases.**

- Rendered card SVGs under `examples/stage-5/` match the current renderers byte-for-byte (regenerate-and-diff). Level: integration/manual command recorded in PR.
- `fly.toml` pins `min_machines_running = 1` and no horizontal autoscale; a test or lint asserts the single-instance constraint is present. Level: unit/config check.
- README documents `GET /<handle>.svg`, the four served states, and the run/deploy commands. Level: manual doc review.

**Components.**

```text
Dockerfile
fly.toml                                  # single instance, PORT from env
examples/stage-5/no-such-legend.svg
examples/stage-5/still-being-written.svg
README.md                                 # image-endpoint + run/deploy section
package.json                              # start script (added Phase 4)
```

**Commit plan.**

1. `feat: add fly deploy config` — Adds `Dockerfile` + `fly.toml` with the single-instance pin. Hygiene: config only.
2. `docs: add image endpoint examples and docs` — Commits rendered card SVGs and README section. Hygiene: docs/examples only.

**Done when.** The server has committed single-instance deploy config, the two cards are shown as committed examples, and the README documents running and deploying the endpoint. Actual deploy + domain provisioning remain flagged as open questions below.

## Open questions

- **Actual Fly deploy + placeholder-domain provisioning.** Human-blocked: needs a Fly account and credentials that cannot be created in this environment. Resolves in Phase 5 once credentials exist; the stage's "done when" (a live URL embedded in a real README) completes only after this deploy.
- **Durable cache across restart/redeploy.** The in-memory cache loses last-good renders on process restart, so "staleness over failure without expiry" (§7) does not survive a redeploy. Acceptable for the placeholder launch; swap a durable adapter behind the same `EpicCache` port later. Resolves outside Stage 5 or when durability is required.
- **Unauthenticated GitHub 60-req/hr/IP budget.** A widely-embedded bad handle could exhaust the anonymous fetch budget. Card `Cache-Control: max-age=300` throttles re-fetch via the camo proxy; revisit as an operational item if abuse appears. Not solved in this stage.

## Out of scope

- Generator page, `?u=` preview, and handle-input UI belong to Stage 6.
- Final name and domain, and the public announcement, belong to the closing stage.
- Multi-instance / horizontally-scaled serving and a shared distributed cache — the in-memory single-origin design is intentional for the placeholder launch.
- Authenticated GitHub APIs and private data remain out of scope; the service uses only logged-out-visible data via the Stage 4 fetch layer.
- Organization and repo epics remain out of scope (an org handle renders the no-such-legend card).
- No LLM participates in serving, caching, fetching, narration, or rendering.
