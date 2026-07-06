# Stage 6 phased plan — cut over and retire the cosmic render

Phased implementation plan for [Stage 6 of the visual-system staged plan](stages.md#stage-6--cut-over-and-retire-the-cosmic-render): flip the default image output from the cosmic/starfield render to the mural, retire the `?preview=` gate, delete the now-dead cosmic epic renderer, and update docs and examples to the shipped system. After five stages soaking behind preview, the bare `<handle>.svg` becomes the mural for everyone.

## Goal

Make the mural the default and only render. The bare `<handle>.svg` serves the animated mural; `<handle>.png` serves the static export (spec §5 URL scheme). The `?preview=` parameter is gone. The cosmic epic renderer (`render-epic.ts`, `render-epic-svg.ts`, `scenes/*`) is deleted along with its now-orphaned support exports. Docs, the public API surface, the CLI, and examples reflect the shipped mural system. Every endpoint guarantee (§7) still holds: valid SVG always, cards for the error states, byte-stable determinism.

## Context

The mural is fully built and stacked below this branch (Stages 0–5). Both mural surfaces already exist and are wired:
- `renderMural(snapshot, world = 'desert')` → animated SVG (`render-mural.ts:20`).
- `renderMuralExport(snapshot, world = 'desert')` → static row-wrapped SVG (`render-mural.ts:24`).
- Both share `buildSceneFromSnapshot` (`render-mural.ts:13`), so story/badge parity holds by construction.

Today the service still defaults to cosmic:
- `route-service-request.ts` accepts only a `.svg` suffix (`:11,35`) and derives the variant from `?preview=` via `parseVariant` (`:47-56`): `mural-static`→`'static'`, `mural`→`'mural'`, else `'cosmic'`.
- `handle-image-request.ts` takes `EpicVariant = 'cosmic'|'mural'|'static'` (`:21`), default `'cosmic'` (`:28`), cache key bare `handleKey` for cosmic else `${handleKey}:${variant}:${worldName}` (`:38`), and `renderVariant` (`:72`) calls `renderEpic` for cosmic (`:79`).

The cosmic epic renderer:
- `render-epic.ts` → `renderEpicSvg` (`render-epic-svg.ts`) → the seven scenes in `rendering/scenes/*` plus `starfield.ts`, `svg-gradients.ts`, `scene-primitives.ts`, `visual-vocabulary.ts`.
- Production consumers of `renderEpic`: `handle-image-request.ts:4` (cosmic arm), `index.ts:1` (public export), `github/live-snapshot-files.ts:4` (`writeRenderedSnapshotFile`, used by `pnpm render-github-handle`), and `scripts/render-fixture-to-svg.ts`.
- Foil consumers in tests (import `renderEpic` only to assert "mural ≠ cosmic"): `render-mural.test.ts:9`, `mural-strengths-integration.test.ts:8`, `render-mural.done-when.test.ts:9`. `handle-image-request.test.ts:3` is a **behavior** test asserting the bare path renders cosmic.

The fallback cards share the cosmic chrome and **must survive** (spec §7:263): `card-frame.ts:11-14` builds `renderNoSuchLegendCard` / `renderStillBeingWrittenCard` from `renderBackdropStarfield`/`renderTwinklingStars` (`starfield.ts`), `renderUniverseGradients` (`svg-gradients.ts`), `scene-primitives.ts`, and `PALETTE` (`visual-vocabulary.ts`). These are still called from `handle-image-request.ts:9-10` and `route-service-request.ts:1`.

The package has **zero runtime dependencies** — no rasterizer, and adding one is out of scope ("no new rendering capability").

## Guiding constraints (from the visual spec and staged plan)

- **Route by extension, per spec §5 (`:134-138`).** `<handle>.svg` → animated mural; `<handle>.png` → static export; both honor `?world=`. The spec's own embed snippet uses `.png?world=river` (`:300`), which Stage 7's generator will emit — so the address must be `.png` now, not deferred.
- **No rasterization.** The `.png` response body is the `renderMuralExport` SVG string; Content-Type stays `image/svg+xml; charset=utf-8`. GitHub camo proxies on Content-Type, not extension, so SVG-under-`.png` works. Real PNG rasterization needs a dependency — explicitly out of scope; recorded as a deferred future decision.
- **"Cosmic layer removed" == the epic renderer only.** The DIE set is `render-epic.ts`, `render-epic-svg.ts`, `scenes/*`. The card chrome (`card-frame.ts`, `starfield.ts`, `svg-gradients.ts`, `scene-primitives.ts`, `visual-vocabulary.ts`) STAYS — it still renders the two error cards. Docs must say "the cosmic *epic* renderer is retired; starfield survives only as static error-card chrome," never claim `starfield.ts` was deleted.
- **Green at every commit.** Deletion of `render-epic.ts` happens only after all consumers are severed. Order is load-bearing: flip behavior → sever consumers → delete code → docs.
- **Grace floor and error states unchanged.** Unknown handle → "no such legend"; upstream down + cache → cached epic; upstream down + no cache → "still being written". Never a broken image (§7:263).
- **Determinism holds.** `identical (data, world) → identical bytes`. Committed sample bytes are pinned in the same commit that generates them.
- **TDD.** Red test first every phase (`CLAUDE.md`).

## Architecture at a glance

- **Variant model collapses** to `EpicVariant = 'mural' | 'static'`. `handleImageRequest` default becomes `'mural'`. Cache key is unconditionally `${handleKey}:${variant}:${worldName}` — the bare-handle special case is gone; orphaned old cosmic entries age out. `renderVariant` sheds the `'cosmic'` arm and the `renderEpic` import.
- **Router keys off extension.** Replace the single `SVG_SUFFIX` gate with an extension→variant map: `.svg`→`'mural'`, `.png`→`'static'`, anything else → 404. Strip the 4-char suffix for the handle. `parseVariant`/`?preview=` deleted. `?world=` parsing untouched — both extensions honor it.
- **Public API** drops `renderEpic` from `index.ts`; `renderMural` is the render API.
- **CLI** loses the redundant `render-fixture` (`render-mural` already covers fixture→mural). `live-snapshot-files.ts` `writeRenderedSnapshotFile` repoints to `renderMural`, fixing `render-github-handle`. No world argument on the CLI — it is a default-hash-world dev preview; world is an endpoint concern resolved server-side by `resolveWorldName`.
- **Cosmic renderer deleted** last: `render-epic.ts`, `render-epic-svg.ts`, `scenes/*` and their tests. `scene-primitives.ts` exports used only by scenes (`expandingRing`, `sparkGlow`, `SCENE_CENTER_Y`) go dead the instant scenes die and are pruned in the same commit. The card chrome stays.
- **Docs**: README switches Usage to `renderMural`, documents the extension scheme, drops every `?preview=`. 000 spec §6 and Amendment 1 get a dated pointer note. `examples/stage-6/` holds the rich fixture's animated mural (`.svg`) and static export (`.png` bytes), wired into the README endpoint section.

## Phases

## Phase 1 — Behavioral cutover (default flip + extension routing)

Flip the default and retire the preview gate. Router and handler change together — they are two halves of one contract (extension → variant → render); splitting them leaves an intermediate commit where the router emits a variant the handler rejects. One cutover, one commit.

**Changes.**
- `handle-image-request.ts`: `EpicVariant = 'mural' | 'static'`; default variant `'mural'`; cache key unconditionally `${handleKey}:${variant}:${worldName}`; `renderVariant` drops the `'cosmic'` case and the `renderEpic` import (`:4`).
- `route-service-request.ts`: replace the `SVG_SUFFIX` gate (`:11,35`) with an extension→variant map (`.svg`→`'mural'`, `.png`→`'static'`, else 404); strip the matched 4-char suffix for the handle; delete `parseVariant` (`:47-56`) and all `?preview=` handling; keep `?world=` (`:42`) and the HEAD/405/placeholder paths.

**Test cases (RED first).**
- `handle-image-request.test.ts`: the default/bare-path test is **rewritten** — bare `<handle>.svg` output == `renderMural(snapshot, resolvedWorld)` (was cosmic). This is the red test that drives the flip.
- `.png` request → output == `renderMuralExport(snapshot, resolvedWorld)`, Content-Type `image/svg+xml; charset=utf-8`.
- Cache key is `${handleKey}:mural:${worldName}` for `.svg` and `${handleKey}:static:${worldName}` for `.png` (assert via seeded cache entries served without a fetch).
- `route-service-request.test.ts`: rewrite the `?preview=` suite. `.svg` → mural key; `.png` → static key; `?world=river` on both → matching per-world key; unknown/absent world → hash-default. Drop every cosmic/`?preview=` case (`:79-147`). Keep the 404 (non-`.svg`/`.png`), 405, HEAD, and thrown-handler placeholder cases; add `.png` to the HEAD case.
- A `.png` path with an invalid handle still returns the "no such legend" card (error states are extension-independent).

**Commit.** `feat: serve the mural by default and address the static export at .png` — single green commit; bare URL now serves the mural, `renderEpic` has no service consumer.

## Phase 2 — Sever the remaining renderEpic consumers

Remove every consumer of `renderEpic` so the symbol is dead before deletion. No cosmic file is deleted yet — the tree stays green (an unused export is not an eslint error).

**Changes.**
- `github/live-snapshot-files.ts`: `writeRenderedSnapshotFile` calls `renderMural(snapshot)` (drop the `renderEpic` import `:4`). This fixes `pnpm render-github-handle`.
- Delete `scripts/render-fixture-to-svg.ts` and the `render-fixture` package script (`render-mural` already renders fixture→mural; one name, one behavior).
- `index.ts`: drop the `renderEpic` export (`:1`). `renderMural` (`:2`) is the render API.
- Remove the vacuous `renderEpic` foil import + "mural ≠ cosmic" assertion from `render-mural.test.ts` (`:9`), `mural-strengths-integration.test.ts` (`:8`), and `render-mural.done-when.test.ts` (`:9`). Keep each file's mural-property assertions.

**Test cases.**
- Existing `live-snapshot-cli.test.ts` (imports `renderEpic` at `:6`) is updated to assert `writeRenderedSnapshotFile` writes the mural (`renderMural`) output, not cosmic.
- After this phase, a repo-wide check that `renderEpic` has no non-cosmic-file reference (verified by the suite passing without the removed imports).

**Commit.** `refactor: repoint the CLI and public API off the cosmic renderer` — after this commit `renderEpic` has zero consumers.

## Phase 3 — Delete the cosmic epic renderer and dead support

Delete the now-unreferenced cosmic renderer and its orphaned exports. The card chrome stays.

**Changes.**
- Delete `src/render-epic.ts` (+ `render-epic.test.ts`).
- Delete `src/rendering/render-epic-svg.ts` (+ `render-epic-svg.test.ts`) — sole consumer of `scenes/*`.
- Delete all seven `src/rendering/scenes/*` (origin, dark-age, flagship-rise, prolificacy, language-era, great-streak, star-milestone) + their tests.
- Prune the now-dead `scene-primitives.ts` exports used only by scenes: `expandingRing`, `sparkGlow`, `SCENE_CENTER_Y`. Keep everything the cards still use (`CANVAS_WIDTH/HEIGHT`, `CENTER_X`, `centeredText`, `fadingRule`, `ornamentDot`).

**Test cases / verification.**
- `pnpm test && pnpm lint && pnpm typecheck` green — proves no live reference into the deleted files.
- The two card tests (`no-such-legend-card.test.ts`, `still-being-written-card.test.ts`) still pass — `starfield.ts`, `svg-gradients.ts`, `scene-primitives.ts`, `visual-vocabulary.ts`, `card-frame.ts` all STAY and render the cards.
- `scene-primitives.test.ts` (if it covers the pruned exports) drops those cases.

**Commit.** `refactor: delete the retired cosmic epic renderer` — card chrome retained.

## Phase 4 — Docs, examples, and the done-when pin

Update docs and examples to the shipped mural system and pin the cutover behavior.

**Changes.**
- `README.md`:
  - Usage (`:14,25`) → `renderMural`.
  - Endpoint section (`:70-83`): lead with the extension scheme — `<handle>.svg` = animated mural (default), `<handle>.png` = static row-wrapped export, both honor `?world=`. Keep the four served-states table (`:76-81`) and the two fallback cards (`:87-89`).
  - Worlds section (`:91-111`): drop the "preview" framing and every `?preview=` token; the table rows become `?world=river` / `?world=mountain` / absent / wrong-case, plus a `.png?world=…` row showing the static path honors world.
  - Fix the `render-fixture` / `render-github-handle` references to the surviving `render-mural` / repointed `render-github-handle`.
  - Wire the new `examples/stage-6/` static (`.png`) sample into the endpoint section so the static output is shown, not just described.
- `plans/000/git-epic-functional-spec.md`: add a one-line dated pointer atop §6 and atop Amendment 1 — "Superseded by plans/008 (2026-07-06) — the cosmic/starfield look is retired; see the visual-system spec." No rewrite, no strike-through; 000 is a historical record.
- `examples/stage-6/`: generate from the existing rich fixture — the animated mural (`.svg`, default hash world) and the static export (`.png`, SVG bytes). Distinct from `examples/stage-5/` (cards) and `static-export*` (raw stage-5 export). Determinism holds.

**Test cases (done-when — assert BEHAVIOR, not source).**
- Bare `<handle>.svg` render carries the mural's markers (title/road/ribbon layer signatures) — the default serves the mural.
- `<handle>.png` render == `renderMuralExport` and carries no SMIL/`<animate>` — genuinely static.
- The **mural body** contains none of the cosmic markers (e.g. no `url(#nebula)` / starfield backdrop). Scope this to the mural render only — the error cards legitimately still emit `#nebula` via `card-frame.ts:31`, so do NOT assert the card path is cosmic-free, and do NOT grep source or assert file non-existence (brittle, wrong layer).
- The two fallback cards still render (invalid handle → "no such legend"; thrown handler → "still being written").
- Pin the committed `examples/stage-6/` sample bytes in the same commit that generates them, so the samples and the pinned bytes can't drift.

**Commit.** `docs: cut docs and examples over to the mural default` — README + 000 pointers + `examples/stage-6/` + done-when test in one commit.

## Recorded open question (non-blocking)

Whether the `.png` address should later become **true PNG rasterization** rather than SVG bytes served under a `.png` path. Deferred to a future effort: spec §5 commits the `.png` URL, GitHub camo proxies on Content-Type so SVG-under-`.png` works today, and the package is zero-dependency by design. Not load-bearing for this stage — resolved as "ship SVG bytes now, rasterize later if a real client needs it." No phase depends on the answer.
