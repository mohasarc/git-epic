# git-epic staged plan

Staged plan for building git-epic to the behavior defined in the [functional spec](git-epic-functional-spec.md). Breaks the path into independently releasable stages ordered by what unlocks what. No code, no types, no implementation tactics here — those live in the implementation.

## Guiding principles

- **TDD.** Failing test first, then make it pass. Every behavior has a test that would fail without it.
- **Determinism.** Same data in, same SVG out, byte-for-byte. Randomness only when seeded from the handle.
- **Fully mechanical.** No LLM anywhere. Narration comes from a fixed template catalog; a rule that can't fire omits its chapter, never improvises.
- **Cache-friendly rendering.** SVG regenerates only when underlying data changes; animation is baked into the document (SMIL), never server-driven.
- **Docs track behavior.** User-visible behavior changes update docs and examples in the same stage.

When scope and a principle conflict, the principle wins.

## Context recap

Repo is a freshly scaffolded TypeScript package: tooling, lint, vitest, no source yet. The spec fixes the visual grammar structure (830×415 dark canvas, replay ≤ 35s, ambient loop, permanent attribution) but leaves the art style to be selected from rendered prototypes and documented as a spec amendment. The core of the product is a pure function from public GitHub data to an animated SVG; the service around it adds fetching, caching, and two unauthenticated GET endpoints. Working name and domain are pending.

## Stage 1 — Grace-floor epic, end to end

**What we deliver.** The smallest complete epic: given a snapshot of a user's public data, the library produces a deterministic animated SVG — title card, Origin chapter with templated narration, present-day card, ambient state with permanent attribution. This is the spec's grace-floor epic (3.6), and it is a real, embeddable artifact.

**Why this stage.** It is the thinnest slice that touches every concern the effort will touch: data model, chapter detection, template narration, SMIL animation, determinism testing. Locking the shape here means later stages only add breadth, not new kinds of work.

**In scope.**

- Data snapshot shape the whole pipeline consumes, built from fixtures.
- Origin chapter detection and its narration template.
- Rendering: title card, one chapter scene, present-day card, ambient loop with "The Epic of &lt;handle&gt;" and the forge-yours credit line, in a placeholder style, on the 830×415 dark canvas. Final style comes from Stage 0, which now runs after Stage 2 and restyles these surfaces.
- Byte-for-byte determinism test: same fixture twice → identical document.
- A way to run the pipeline locally against a fixture and eyeball the output.

**Out of scope.**

- The other six chapter rules (Stage 2).
- Scenes beyond Origin (Stage 3).
- Fetching anything from GitHub (Stage 4).
- Serving over HTTP (Stage 5).

**Done when.** A fixture representing a single-contribution account yields an SVG that replays title → origin → present and settles into ambient, plays inside a GitHub README, and regenerating from the same fixture is byte-identical.

## Stage 2 — Full chapter catalog

**What we deliver.** All seven chapter rules from the spec's catalog (8.1), with narrated captions. Given any history snapshot, the library returns the chronological, precedence-tie-broken, 8-capped list of chapters with their template-generated narration.

**Why this stage.** Detection and narration are pure data-to-data rules — fully testable from fixtures, independent of visuals. Locking them before scene rendering means Stage 3 draws against a stable chapter list instead of a moving one.

**In scope.**

- Detection rules: Language era, Flagship rise, Star milestone, Dark Age, Great Streak, Prolificacy — each with the spec's thresholds.
- Chronological ordering, deterministic tie-breaking by chapter-type precedence, 8-chapter cap by drama precedence then earliest-first.
- Narration templates per chapter type in the epic register, numbers spelled per the spec's rules.
- Fixture library covering rule boundaries: threshold edges, zero-chapter histories, 15-year histories that overflow the cap.

**Out of scope.**

- Visual scenes for the new chapter types (Stage 3) — Stage 2 chapters render as data, verified by tests, not yet drawn.
- Live data (Stage 4).

**Done when.** Every catalog rule has boundary tests, a rich fixture produces exactly the spec's precedence-ordered capped chapter list with narration, and the same fixture always yields the identical list.

## Stage 0 — Art style selection

Planned as the first stage, skipped in practice — Stages 1 and 2 shipped without it. Moved here, ahead of the heavy visual work, and adapted: it now also covers restyling what Stage 1 already renders. Keeps its number; references elsewhere stay valid.

**What we deliver.** A chosen art style, decided from rendered prototypes, documented as an amendment to the functional spec, with Stage 1's grace-floor rendering restyled to match. After this stage every rendering decision has a visual target.

**Why this stage.** Stage 3 draws a scene per chapter type; starting that without a locked style means restyling all of it later. The skip was cheap so far: Stage 2 is data-only, and Stage 1's visual surface is small — title card, Origin scene, present-day card, ambient frame. That surface is the whole repair bill.

**In scope.**

- Two or three prototype SVGs of the leading candidates (universe-from-first-commit among them), each showing a title card, one chapter scene, and an ambient frame. Standalone sketches or renders through the existing pipeline — both work now that a pipeline exists.
- Style ideation may use image-generation tools; committed prototypes are hand-built SVG.
- Storytelling is visual: minimal text, and any text is a styled element of the composition, not a subtitle under a scene. This constraint goes into the amendment.
- Verify prototypes animate inside a GitHub README (SMIL survives GitHub's image proxy).
- Pick one; record the choice and its visual vocabulary as a spec amendment.
- Restyle Stage 1's rendered surfaces to the chosen style; determinism tests keep passing.

**Out of scope.**

- Scenes for the full chapter catalog (Stage 3).
- Detection, narration, and data changes — Stages 1–2 logic stays untouched; only rendering changes.

**Done when.** A prototype embedded in a real README on github.com plays its animation, the spec carries an amendment naming the chosen style and its text-minimal storytelling rules, and the grace-floor epic renders in that style.

## Stage 3 — Full replay and ambient rendering

**What we deliver.** Every chapter type has a scene in the chosen style; the full replay plays chapters in sequence within the 35-second budget, and the ambient state reflects the accumulated history rather than a generic frame. Any history snapshot now renders as its complete saga.

**Why this stage.** This is the heaviest visual work and it compounds Stages 0–2: style, pipeline shape, and chapter list are all locked, so this stage is pure breadth on battle-tested primitives.

**In scope.**

- A scene per chapter type, with narration caption, 3.5 seconds each.
- Replay timing: 3-second title card, up to 8 chapters, present-day card, total ≤ 35 seconds.
- Ambient state derived from the history (the accumulated present-day scene), slow idle motion, looping indefinitely.
- Determinism and README-playability checks extended to full-length epics.

**Out of scope.**

- Fetching (Stage 4), serving (Stage 5).
- Error-state cards — those belong to the service surface (Stage 5).

**Done when.** A fixture that fires all seven rules renders a replay hitting every scene within budget, the embedded result plays correctly in a GitHub README, and byte-determinism holds for full epics.

## Stage 4 — Live GitHub data

**What we deliver.** The pipeline runs against a real handle: public, logged-out-visible GitHub data is fetched and shaped into the snapshot the library consumes. Anyone can generate a real epic for a real user locally.

**Why this stage.** Everything before it is pure and fixture-fed by design; the fetch layer is the first impure boundary and only needs to exist once the pipeline it feeds is trustworthy. Doing it after Stage 3 means real-world output is immediately judgeable end to end.

**In scope.**

- Fetching the public data the chapter catalog needs, exactly as visible to a logged-out visitor — no auth, no private data.
- Handle resolution: case-insensitive input, canonical casing in output, nonexistent-handle and organization-handle detection, all dates in UTC.
- Rate-limit awareness surfaced as a distinct fetch outcome (the service decides what to do with it in Stage 5).
- Snapshot capture from a live handle into a fixture, so real accounts become regression fixtures.

**Out of scope.**

- HTTP serving, caching, and error cards (Stage 5).
- Any retry/staleness policy (Stage 5).

**Done when.** Running the generator against a real handle produces that user's epic, an org handle and a nonexistent handle are each detected as such, and a captured snapshot re-renders byte-identically offline.

## Stage 5 — Image endpoint service

**What we deliver.** The epic goes live: an unauthenticated GET at the handle-dot-svg address returns a renderable SVG for every request — the epic, the "no such legend" card, or the "still being written" placeholder — with the spec's freshness and staleness behavior. A README can embed a real, self-updating epic.

**Why this stage.** The service is composition: Stage 4's fetch plus Stage 3's render plus caching policy. It ships only when the thing it serves is already correct, so service work is purely about availability, caching, and failure states.

**In scope.**

- Image endpoint: handle in path, unknown query parameters ignored, never a broken image.
- 24-hour freshness window; identical document for all viewers within it.
- Staleness over failure: fetch fails with a cached epic → serve the cache without expiry.
- "No such legend" card for nonexistent and org handles; "still being written" placeholder with 5-minute cache retry when no cache exists.
- Deployment to a reachable host (placeholder domain acceptable; final domain is the closing stage).

**Out of scope.**

- Generator page (Stage 6).
- Final name and domain, public announcement (closing stage).

**Done when.** An embed of the live URL in a real README replays and settles into ambient; a nonexistent handle, an org handle, and a simulated upstream outage each render their designed card; two requests within the window return the identical document.

## Stage 6 — Generator page

**What we deliver.** The human entry point: landing page with handle input, live preview served by the real image endpoint, and a copy button yielding the exact embed snippet. The `?u=` form pre-fills and pre-renders, completing the click-through loop from any embedded epic.

**Why this stage.** The page is a thin veneer over the live endpoint — it cannot honestly exist earlier because its preview is defined as real endpoint output, not a mock.

**In scope.**

- Landing with empty input; `?u=` variant pre-filled and pre-rendered.
- Invalid handle syntax → inline message, no request; valid-but-unknown handle → the real "no such legend" preview.
- Copy button producing exactly the spec's snippet: image linked to the generator page with the subject pre-filled.
- Embedded epics click through to the generator with the subject's handle.

**Out of scope.**

- Accounts, galleries, share integrations — excluded from v1 by the spec.
- Announcement and final domain (closing stage).

**Done when.** A visitor can go from landing to a pasted, working README embed in under a minute, and clicking someone else's embedded epic lands on the generator with that handle pre-rendered.

## Closing stage — Name, domain, launch

**What we deliver.** The pending product decisions the spec leaves open: final name and domain. Credit line, embed snippet, and generator URL all point at the final domain; the repository README carries the project's own epic; the project is announced.

**Why a closing stage.** Embed snippets bake permanent URLs into third-party READMEs — the domain must be final before inviting embeds at scale, and it can only be flipped once, after everything behind it has soaked on the placeholder.

**In scope.**

- Final name and domain decided and registered; spec amended.
- Credit line and snippet cut over to the final domain.
- Repo README shows a live epic and the copy-paste path.
- Public announcement.

**Done when.** The snippet copied from the live generator uses the final domain, the repo README's own epic renders from it, and the project is publicly announced.

## Beyond scope

Per the spec's v1 exclusions — catalogued so they don't leak into stages:

- Repo epics and organization accounts.
- Any LLM-generated content.
- Video/GIF/MP4 export.
- Theme, color, size parameters; light mode.
- Localization.
- Authentication and private data.
- Viewer personalization, cross-user features, leaderboards.
- Analytics, tracking, view counting.
- Chapter editing, hiding, reordering.

## Sequencing summary

| Stage | Delivers | Primary new capability |
| --- | --- | --- |
| 1 | Grace-floor epic from fixtures | End-to-end pipeline shape, determinism |
| 2 | All seven chapter rules + narration | Any history → capped narrated chapter list |
| 0 | Chosen art style, spec amendment, grace-floor restyle | Visual target verified inside GitHub |
| 3 | Full replay + ambient | Any history → complete rendered saga |
| 4 | Live GitHub data | Real handles, real epics, locally |
| 5 | Image endpoint | Live embeddable URL, freshness, failure cards |
| 6 | Generator page | Type handle → copy snippet loop |
| Close | Name, domain, launch | Final URLs, public release |
