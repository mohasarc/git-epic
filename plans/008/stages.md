# git-epic visual system — staged plan

This is a staged plan for rebuilding the epic's visual layer per [`git-epic-visual-system-functional-spec.md`](git-epic-visual-system-functional-spec.md). The goal — a horizontal panning-mural epic that replaces the cosmic/starfield render — is defined there and not restated. No code, types, or implementation details appear here; only what each stage delivers and why it comes when it does.

## Guiding Principles

- **Determinism.** Same GitHub data + same chosen world → identical bytes. Any randomness is seeded from the handle and only breaks ties.
- **No LLM, ever.** All generation is mechanical, from a fixed template and asset catalog.
- **Distinctness from data, not novelty.** Similar histories look similar. The system never manufactures difference for its own sake.
- **Feel-good, never shaming.** Every epic surfaces at least one real strength. Tier reads through scale and grandeur, never through decay; small histories render as small-but-hopeful, and decay is reserved for earned silence.
- **Grace floor.** Every account — down to one commit — renders a complete, composed scene. Never empty, never broken.
- **Text never gates a render.** Every era, strength, and badge has a safe-default line; the visual engine renders regardless of copy quality.
- **Modular under a hard asset contract.** Reusable parts, normalized and recolorable, under a per-module path budget so the full strip stays a GitHub-safe file.
- **Self-contained baked animation.** All motion is in the SVG; nothing server-driven; no JavaScript required.
- **Finish to polish — there is no v2.** Scope is bounded so every shipped piece can reach a high bar.

When scope and a principle conflict, the principle wins.

## Context Recap

The **data layer already exists and is reused**: chapter detection, the timeline/segment engine, the GitHub snapshot fetch, and the grandiose-parody narration. What is being replaced is only the render layer — today a cosmic/starfield look, to become the flat-vector mural.

Constraints that shape the stages:

- The image endpoint must **always return a valid SVG** (unknown handle, upstream outage, rate-limit all produce designed states). No stage may regress this.
- The mural needs **data the current snapshot lacks** — forks, followers, PR count, issue count — which is why data work leads.
- Two outputs are in scope: the **animated panning SVG** and a **static row-wrapped image export**.
- World variation is a **URL parameter** (desert / river / mountain), defaulting to a hash of the handle. No server-side per-user state.
- New work lands **behind a preview/opt-in surface** and the live default stays the current render until the new system is fully good; the cutover is the closing stage. This avoids regressing the live embed mid-rebuild.
- TDD per project rules: the failing test comes first.

## Stage 0 — Data foundation and strengths engine

**What we deliver.** The snapshot gains forks, followers, PR count, and issue count, and a new strengths model scores each user's dimensions (per-dimension baseline tiers plus a relative guarantee that the user's own top dimension always ranks). Nothing visible changes; the data the whole mural depends on now exists and is inspectable.

**Why this stage.** Every later visual stage consumes this data. Half the strength motifs and all the badges are impossible without it. It carries the one real external-dependency risk (the Search API for PR/issue counts, its rate limits and caching) so that risk is retired before any art is drawn.

**In scope.**
- Extend the fetch layer with forks and followers (free fields) and PR/issue counts (search-based), with hard caching keyed by handle.
- The strengths scoring: absolute baseline tiers per dimension, plus the relative top-dimension guarantee.
- Graceful degradation when a search count is unavailable (the dimension is simply quiet, never an error).
- Test coverage for scoring across rich, modest, lopsided, and zero-activity profiles.

**Out of scope.**
- Any rendering of strengths — that is Stage 2.
- Collaborator/contributor data (excluded from the product entirely).

**Done when.** For any handle, the pipeline produces the extended snapshot and a strengths result; a modest account still yields a highlighted top dimension; a zero-activity account scores without error; the live SVG is unchanged.

## Stage 1 — Mural foundation: one world, static, complete

**What we deliver.** A new static mural renderer that turns any handle into one continuous illustrated strip in the committed flat-vector style: a single continuous road, the temporal eras placed as stretches along it, the contribution ribbon along the bottom, terse title/subtitle/plaque text, all in one world family (desert) across its ancient→classical→modern tiers. Reachable via a preview surface and rendering a complete, grace-floored epic for every account. No animation, no strength motifs yet.

**Why this stage.** This is the shape stage. It exercises every hard concern at once — the flat-vector asset contract and path budget, the typed-slot grammar, data-driven parametric knobs (count, height, scale, label), the continuous-road spine, the ribbon, the text-with-fallback layer, determinism, and the grace floor — on the smallest complete surface. Getting the grammar right here is what makes every later stage cheap.

**In scope.**
- The flat-vector style system and the reusable-module asset contract (normalized, recolorable, path-budgeted).
- The typed-slot layout grammar and parametric fill; modules snap without overlap; the road threads unbroken with soft seams.
- One world (desert), all three architecture tiers advancing with real time.
- Temporal eras from the existing chapter engine placed as road stretches with dwell-appropriate widths.
- The contribution ribbon (honest per-day data) as the bottom band.
- Terse visible text with guaranteed safe-default fallbacks.
- A preview surface to view the new mural without changing the default embed.
- Verification across rich, modest, single-commit, and XML-hostile handles; determinism (identical bytes) confirmed.

**Out of scope.**
- Strength motifs and the badge finale (Stage 2).
- Animation of any kind (Stage 3).
- River and mountain worlds (Stage 4).
- The row-wrapped export as a distinct output (Stage 5).

**Done when.** The preview renders a complete, coherent static desert mural for any handle; a one-commit account gets a dignified camp; two similar histories look similar; re-rendering the same data yields identical bytes; the live default embed is untouched.

## Stage 2 — Strengths made visible

**What we deliver.** The mural now reflects what each developer is strongest at. Dimension-driven motifs appear inside eras — language boulevards, star crowns and ceremonial gates, PR bridges, issue notice-boards, fork side-roads, follower crowds, construction density — and the journey ends on the present-day badge finale naming the user's top titles. Still static, still one world, still preview.

**Why this stage.** The strengths data (Stage 0) and the scene surface (Stage 1) both exist; this is the stage that fuses them into the product's emotional payload. It comes before motion because a still frame is the honest test of whether the strengths read at a glance — and before more worlds because the motif vocabulary should be proven once before it is multiplied.

**In scope.**
- The dimension→motif mapping rendered as parametric additions to eras (intensity from baseline tiers).
- Standout monuments for a user's spike dimensions, layered on overall world scale.
- The present-day badge finale panel, labels derived from strength scores.
- Compact digit number-plaques on the relevant objects.
- The feel-good and never-shaming guarantees verified: modest accounts still get a motif and a badge; weak dimensions stay quiet, never called out.

**Out of scope.**
- Collaborator/contributed-to motifs (excluded from the product).
- Animation (Stage 3); additional worlds (Stage 4).

**Done when.** A polyglot, a star-heavy account, a PR-heavy account, and a modest account each produce a visibly different emphasis and an accurate badge finale; no epic reads as a list of shortfalls; tier is legible without any small account rendering as decayed.

## Stage 3 — Motion: dwell-and-zip camera

**What we deliver.** The static mural becomes the flagship animated experience: on load the camera drifts slowly across each era and zips (a fast smooth whip, never a cut) to the next, per-era beats fire on the dwell, depth layers parallax during travel, and the replay freezes on the badge finale before handing off to a living ambient loop. One world, preview.

**Why this stage.** Motion is the highest-risk novel piece (baked dwell-and-zip choreography, per-era beat timing, parallax, the freeze-then-ambient handoff, and keeping the file GitHub-safe). Proving it on one fully-built world — before multiplying worlds — means the camera is battle-tested on a single asset set rather than three.

**In scope.**
- The dwell-and-zip camera as baked animation, bounded to ~12–18s, ending on the present-day dwell.
- Per-era intro beats fired during dwells; parallax depth during zips.
- The frozen final frame and the perpetual ambient micro-loops.
- File-size discipline verified against the animated full strip.

**Out of scope.**
- River and mountain worlds (Stage 4).
- The static export, which deliberately carries no motion (Stage 5).

**Done when.** The preview plays the journey once per load, dwelling readably and zipping without cuts, freezes on the badge finale, and loops ambiently; the animated file stays within a GitHub-safe budget; output remains deterministic.

## Stage 4 — The other two worlds

**What we deliver.** River and mountain join desert, each with its own ancient→classical→modern vocabulary, and the `world` URL parameter selects among them (defaulting to a hash of the handle). The full three-world variation is live in preview.

**Why this stage.** By now the grammar, motifs, camera, and file budget are proven on one world; adding worlds is mechanical repetition of a battle-tested pipeline rather than exploration. Doing it after motion avoids animating three asset sets before knowing the camera works.

**In scope.**
- The river and mountain asset sets across all three tiers, under the same contract and budget.
- The `world` parameter and its hash default; validation that an unknown value falls back cleanly.
- Verification that all three worlds render, animate, and stay deterministic and grace-floored.

**Out of scope.**
- A fourth world or any non-world knob (excluded from the product).
- The static export (Stage 5).

**Done when.** All three worlds render complete animated epics for any handle; the `world` parameter picks one and an absent/invalid value hash-defaults; each world holds the same guarantees as desert.

## Stage 5 — Static image export

**What we deliver.** A motion-free image export that lays the same world out as stacked rows (the mural wrapped like paragraphs) with the exact true contribution ribbon under each row, all plaques, and the badge finale — the shareable off-GitHub artifact and the reduced-motion fallback. Available for all three worlds.

**Why this stage.** It reuses the fully-built scene model and asset sets from earlier stages plus one new ingredient — the row-wrapping layout and the strict "exact activity chart" ribbon — so it comes after the mural is complete. It is lower-risk than motion and sensibly covers all worlds at once.

**In scope.**
- Row-wrapped layout of the scene model into a static image.
- The exact-true-activity ribbon under each row.
- Parity of story, strengths, and badges with the animated version.
- Verification across worlds and profile shapes; the export is a valid still with no animation.

**Out of scope.**
- Any animation in the export.
- Layout knobs beyond what the spec defines.

**Done when.** The image endpoint returns a row-wrapped static export for any handle and world, showing the exact activity chart, matching the animated epic's story and badges, with no motion.

## Stage 6 — Cut over and retire the cosmic render

**What we deliver.** The new mural becomes the default for the bare image URL, the old cosmic/starfield render layer is removed, and docs and examples are updated to the new system. After soaking behind preview, the flagship embed is the mural for everyone.

**Why this stage.** The cutover and the decommission of the old renderer can only happen once every earlier stage has soaked behind preview and proven itself. Flipping the default and deleting the old path is genuine end-of-effort work that cannot be done earlier without regressing the live embed.

**In scope.**
- Flip the default image output to the mural; retire the preview gate.
- Remove the cosmic/starfield render layer and its now-dead supporting code.
- Update README, examples, and the 000 spec's superseded sections.

**Out of scope.**
- The generator page and its picker (Stage 7).
- Any new rendering capability — this stage only flips the default and cleans up.

**Done when.** The bare `<handle>.svg` serves the mural; the starfield layer is gone; docs and examples reflect the shipped system; all endpoint guarantees still hold.

## Stage 7 — Generator page (carried over from 000 Stage 6, never built)

**What we deliver.** The human entry point, which was planned but never implemented in the original effort: a landing page with a handle input, a live preview served by the real image endpoint (now the mural), a three-way world picker feeding the `world` parameter, and a copy button producing the exact embed snippet. The `?u=` form pre-fills and pre-renders, completing the click-through loop from any embedded epic.

**Why this stage.** The page is a thin veneer over the live endpoint — its preview is defined as real endpoint output, so it can only exist once the endpoint serves the mural by default (Stage 6). The world picker only makes sense once all three worlds exist (Stage 4). Both dependencies are met by now.

**In scope.**
- Landing with empty input; `?u=` variant pre-filled and pre-rendered.
- The three-way world picker (desert / river / mountain / auto) writing the `world` parameter into the copied URL.
- Invalid handle syntax → inline message, no request; valid-but-unknown handle → the real "no such legend" preview.
- Copy button producing exactly the spec's snippet, world choice included, image linked to the generator with the subject pre-filled.
- Embedded epics click through to the generator with the subject's handle pre-rendered.

**Out of scope.**
- Accounts, galleries, share integrations, viewer personalization — excluded by the spec.
- Final name/domain and announcement (closing stage).

**Done when.** A visitor goes from landing to a pasted, working README embed — with an optional world choice — in under a minute, and clicking someone else's embedded epic lands on the generator with that handle pre-rendered from the live mural endpoint.

## Closing Stage — Name, domain, launch (carried over from 000, never done)

**What we deliver.** The pending product decisions the original spec left open: final name and domain. The credit line, embed snippet, and generator URL all point at the final domain; the repository README carries the project's own live epic; the project is announced.

**Why a closing stage.** Embed snippets bake permanent URLs into third-party READMEs — the domain must be final before inviting embeds at scale, and it can only be flipped once, after everything behind it has soaked on the placeholder domain.

**In scope.**
- Final name and domain decided and registered; specs amended.
- Credit line and snippet cut over to the final domain.
- Repo README shows a live epic and the copy-paste path.
- Public announcement.

**Out of scope.**
- Any new capability — this stage only finalizes identity and launches.

**Done when.** The snippet copied from the live generator uses the final domain, the repo README's own epic renders from it, and the project is publicly announced.

## Beyond Scope

- Collaborator/contributor graphs and any "people you worked with" motif.
- Attribution of contributions to other people's repositories ("open-source contributed-to" roads).
- A fourth-plus world family; more than three architecture tiers.
- User-picked palette, time-of-day, tone, or mascot toggles — the only knob is `world`.
- A separate stats-card product distinct from the mural.
- Painterly / gradient-heavy art; continuous constant-speed panning.
- Any LLM anywhere in the pipeline.

## Sequencing Summary

| Stage | Delivers | Primary new capability |
|---|---|---|
| 0 | Extended snapshot + strengths scoring | The data the mural depends on |
| 1 | Static one-world mural, complete for every account | The visual grammar and asset contract |
| 2 | Strength motifs + badge finale | The epic reflects what the user is best at |
| 3 | Dwell-and-zip animated experience | Baked camera, parallax, ambient rest |
| 4 | River and mountain worlds + `world` param | Three-world variation |
| 5 | Static row-wrapped image export | The shareable off-GitHub output |
| 6 | Default cutover, retire cosmic | The mural is the flagship for everyone |
| 7 | Generator page + world picker (carried over from 000) | The human entry point, never built |
| Closing | Name, domain, launch (carried over from 000) | Final identity and public launch |
