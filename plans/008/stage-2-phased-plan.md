# Stage 2 phased plan — strengths made visible

Phased implementation plan for [Stage 2 of the visual-system staged plan](stages.md#stage-2--strengths-made-visible): the static desert mural now reflects what each developer is strongest at. Dimension-driven motifs appear inside eras (language banners, star crowns/gates, PR bridges, issue notice-boards, fork side-roads, follower crowds), a single standout monument for a spike dimension, compact number-plaques on the scalar motifs, and a present-day badge finale naming the user's top titles. Still static (no animation — Stage 3), still one world (desert), still behind `?preview=mural`. The live cosmic embed and every Stage-1 golden stay byte-identical.

## Goal

Fuse the Stage-0 strengths engine (`src/strengths/`) with the Stage-1 scene surface (`src/mural/`) so a polyglot, a star-heavy account, a PR-heavy account, and a modest account each produce a visibly different emphasis and an accurate badge finale. No epic reads as a list of shortfalls; weak dimensions stay quiet; tier reads through scale and grandeur, never decay; every account — down to zero activity — still grace-floors to a complete, hopeful scene.

## Context

Stage 0 delivered `scoreStrengths` → `StrengthsResult { ranked: StrengthScore[]; topDimension; unavailable; dominantLanguage }` where each `StrengthScore` has `dimension`, `rawValue`, `reach`, `tier: 0..4` (`src/strengths/score-strengths.ts`). Ranking is reach-desc, tie-broken by `RANKING_TIE_BREAK_ORDER` (`strength-dimensions.ts`). `dominantLanguage` is `{ name, repoShare } | null`.

Stage 1 delivered the pure model → render split: `buildMuralScene` (`build-mural-scene.ts`) composes named model modules (`partitionEras`, `deriveWorldScale`, `layOutEras`, `allocateSlots`, `bucketRibbon`) into a `MuralScene`; `renderMuralSvg` (`render-mural-svg.ts`) draws it layer by layer. Modules (`modules/`) are atomic single-silhouette shapes, parametric in fill + heightScale, each under `MODULE_PATH_BUDGET`. `scoreStrengths` already runs in `renderMural` and `buildMuralScene` receives the `StrengthsResult` — currently only `deriveWorldScale` and the subtitle consume it.

Stage 2 is purely additive: a new motif-placement model pass, a badge-derivation pass, two new render layers, six new modules, and supporting primitives — wired in without touching the Stage-1 palette, geometry, or goldens.

## Guiding constraints (from the visual spec and staged plan)

- **Determinism.** Same `(data, world)` → identical bytes. No seed anywhere in Stage 2 — motif and badge decisions are pure functions of `StrengthsResult` + the placed eras.
- **Feel-good, never shaming.** Weak dimensions are simply absent from the mural — there is no "weakness" element. Modest accounts still get a motif and a badge. An all-tier-0 account gets a hopeful neutral motif and a generic "The Journey Begins" badge, never a false titled strength (no "Star Magnet" / "0 ★" for a zero account).
- **Grace floor.** Every account, including single-present-day-era ones, renders a complete scene.
- **Distinctness from data, not novelty.** A spike monument fires only when a dimension genuinely punches above the world's overall size — never manufactured for a balanced account.
- **Hard asset contract.** Every new module has a `MODULE_PATH_BUDGET` entry; atom counts are capped so the worst-case render stays a GitHub-safe file with explicit Stage-3 SMIL headroom.
- **Model decides, render draws.** Motif kind, tier, geometry, standout flag, plaque strings, and badge labels are decided in the pure model. Color (accent lookup) stays in the render layer, consistent with Stage 1 keeping `STRUCTURE_FILL` in `structures.ts`.
- **TDD.** Red test first every phase (`CLAUDE.md`).

## Phases

## Phase 1 — Shared text primitive and compact-count formatter

Foundations with no motif dependency, both reused throughout.

- **`layers/svg-text.ts`** — extract the escaped `<text>` emitter currently private in `layers/text.ts` (`textElement`, `text.ts:57`) into a shared primitive taking `(content, x, y, options)`. Re-point `text.ts` to import it. Pure refactor: Stage-1 text golden stays byte-identical. Motifs and the badge finale both import this — no duplicated XML escaping.
- **`compact-count.ts`** (pure model helper) — `n < 1000` → verbatim (`"184"`); `1000 ≤ n < 1_000_000` → `k`, one decimal when the k-value `< 10` else zero (`"1.2k"`, `"4.8k"`, `"18k"`); `n ≥ 1_000_000` → `M`, same rule (`"1.2M"`). Implement via `scaled.toFixed(digits)` then strip a trailing `.0` (carry handles band edges: `9.99k → "10.0" → "10k"`). Suffix-free — the per-dimension suffix and the badge finale both compose onto the bare string.

**Test cases.** `svg-text`: identical output to the old `textElement` for the escaping + anchor/weight/letter-spacing combinations `text.ts` uses; XML-hostile content escaped. `text.ts` golden unchanged (existing test stays green after the refactor). `compact-count`: 0, 184, 999, 1000, 1200, 4800, 9990 (→ `10k`), 18000, 312000, 999999, 1_200_000, and the `.0`-strip cases.

**Commit plan.**
1. `test: pin shared svg-text primitive and compact-count`
2. `refactor: extract shared svg-text emitter`
3. `feat: add compact-count formatter`

## Phase 2 — Palette additions and strengths test fixtures

Vocabulary constants and calibrated test data, both prerequisites for the model/render phases.

- **`mural-vocabulary.ts`** — add `GOLD_ACCENT` and `LANGUAGE_ACCENT: Record<string, string>` (~15 common GitHub languages, exact-name keys: `TypeScript`, `JavaScript`, `Python`, `Go`, `Rust`, `Java`, `Ruby`, `C`, `C++`, `C#`, `PHP`, `Swift`, `Kotlin`, `Shell`, `HTML`, `CSS`) as **sibling top-level constants**, not keys inside `MURAL_PALETTE`. Each accent keeps its language's hue identity but muted/desaturated toward the warm palette (not linguist-literal, not collapsed to orange). Neutral default = `MURAL_PALETTE.structureAccent`. Gold: warm, lifted in value/saturation above `structureBody #c8763c` and distinct from `RIBBON_RAMP`. `MURAL_PALETTE`, `GROUND_TINT`, `STRUCTURE_FILL` stay byte-identical.
- **Backfill grace-floor fixtures.** `brand-new-account.json` and `single-contribution-account.json` omit `followerCount` / `pullRequestsOpenedCount` / `issuesOpenedCount` → they'd read `undefined` → NaN reach through `scoreStrengths`. Backfill all three as `0` (honest zero, not `null`; `null` means "search unavailable"). Both then score cleanly all-tier-0.
- **New profile fixtures** in `test-fixtures/`, each calibrated to land in its intended cell:
  - `polyglot-account.json` — 8–10 distinct languages, no language ≥ 0.5 `repoShare`, modest stars/PRs → `languageBreadth` tops the ranking → Polyglot Explorer badge (not Specialist), boulevard motif.
  - `star-heavy-account.json` — high stars, modest elsewhere, one language leading ≥ 0.5 `repoShare`, stars tier ≥ world baseline + 2 → spike monument + `<Lang> Specialist` badge.
  - `pr-heavy-account.json` — high PRs, modest stars/forks → PR bridge + Heavy PR Contributor badge.

**Test cases.** Palette: `GOLD_ACCENT` and `LANGUAGE_ACCENT` present and non-empty; `MURAL_PALETTE`/`GROUND_TINT`/`STRUCTURE_FILL` deep-equal their Stage-1 values (guard the golden). A fixture-sanity test: each new fixture, run through `scoreStrengths`, produces the intended `topDimension.dimension`, `dominantLanguage.repoShare` band, and — for star-heavy — a stars `tier` clearing the spike gap for that fixture's derived `worldScale`; backfilled grace-floor fixtures score all-tier-0 with no NaN reach.

**Commit plan.**
1. `test: pin gold and language accents and strengths fixtures`
2. `feat: add gold and language-accent palette constants`
3. `test: add polyglot, star-heavy, pr-heavy, backfilled grace fixtures`

## Phase 3 — Motif and badge model types

The typed shapes the model pass fills and the render layers consume. Extends the scene without behavior.

- **`mural-scene.ts`** — add:
  - `MuralMotifKind = 'banner' | 'crownGate' | 'sideRoad' | 'crowd' | 'bridge' | 'noticeBoard'`.
  - `MuralMotif = { dimension: StrengthDimension; kind: MuralMotifKind; tier: 0..4; x; width; baselineY; count; standout: boolean; label?: string; plaque?: string }` (`label` carries the dominant-language name for the banner; `plaque` carries the composed digit string).
  - `Badge = { label: string; plaque?: string }`.
  - Extend `PlacedEra` with `motifs: MuralMotif[]` and `MuralScene` with `badges: Badge[]`.

**Test cases.** Type-level only this phase; covered indirectly — no standalone runtime test. Fold into Phase 4/5 red tests (the plan's first behavioral use). If a compile-only guard is wanted, a trivial construction test asserting the shape.

**Commit plan.**
1. `feat: add motif and badge scene types` (paired with Phase 4's red test; no informative standalone failure).

## Phase 4 — Badge derivation

Pure model, independent of geometry — do it before the larger motif pass.

- **`derive-badges.ts`** — `deriveBadges(strengths): Badge[]`.
  - **Tier-0 branch:** when `ranked[0].tier === 0`, return exactly one generic badge `{ label: 'The Journey Begins' }` — never a dimension title.
  - **Otherwise:** selection = `[ranked[0]]` ∪ `ranked[1..]` filtered to `tier ≥ 1`, capped at 4, floored at 1. Titles from a `Record<StrengthDimension, string>` table, Title Case, one per dimension, tier does not change the noun: `projectCount → "Prolific Builder"`, `stars → "Star Magnet"`, `forks → "Widely Forked"`, `followers → "Followed"`, `pullRequests → "Heavy PR Contributor"`, `issues → "Diligent Reporter"`, `languageBreadth → "Polyglot Explorer"`, `activityVolume → "Relentless"`.
  - **Dominant-language badge:** `"<Lang> Specialist"` leads the panel, emitted only when `dominantLanguage !== null` **and** `repoShare ≥ 0.5`; counts toward the cap of 4. `0.5` is a named calibration default.

**Test cases.** rich-history → up to 4 titled badges, tier-1+ only. star-heavy → `<Lang> Specialist` leads. polyglot → Polyglot Explorer, **not** Specialist (repoShare < 0.5). pr-heavy → Heavy PR Contributor present. modest → exactly its real strengths, floor ≥ 1. brand-new / single-contribution → exactly `[{ label: 'The Journey Begins' }]`. Never-shaming: no badge for any tier-0 dimension beyond the guaranteed slot. Boundary (inline `buildHistorySnapshot`): `repoShare` exactly 0.5 → Specialist emitted (≥, inclusive).

**Commit plan.**
1. `test: pin badge derivation across profiles`
2. `feat: derive present-day badges from strengths`

## Phase 5 — Motif placement (distribution, geometry, spike, plaques)

The core model pass. Pure, no seed, no SVG. Break out sub-modules (the dimension→kind map, plaque-text derivation) as functions grow, per `CLAUDE.md`.

- **`place-motifs.ts`** — `placeMotifs(eras: PlacedEra[], strengths): PlacedEra[]` (attaches `motifs` to each era).
  - **Qualifying set (D5):** walk `strengths.ranked`; keep `tier ≥ 1`, always include `ranked[0]` even at tier 0; exclude `dominantLanguage`'s own dimension routing (the banner is global, added separately), `activityVolume`, and `projectCount` (density already via `allocate-slots`).
  - **Dimension → kind:** `stars → crownGate`, `forks → sideRoad`, `followers → crowd`, `pullRequests → bridge`, `issues → noticeBoard`, `languageBreadth → banner` (boulevard). Dominant language → a recurring `banner` motif with `label = dominantLanguage.name`, added globally (see render, Phase 7), not through the ranked distribution.
  - **Host eras (D6):** order eras by `width` desc, tie-break by left-to-right index. Motif `i` → host `i mod hostCount`; overflow round-robins onto the widest eras. **Present-day is excluded from hosting only when ≥ 1 non-present-day era exists; when present-day is the only era, it hosts motifs too** (grace floor — never `i mod 0`).
  - **Tier-0 guaranteed motif:** when `ranked[0].tier === 0`, the guaranteed motif is a neutral hopeful `marker`/camp-scale element with **no plaque** — never a `"0 ★"` crownGate.
  - **Intensity (D7/D9):** tier drives count/scale, never shape. `crowd` and boulevard `banner` express tier via atom count; `crownGate`/`bridge`/`noticeBoard`/`sideRoad` via scale + plaque.
  - **Geometry (D14/D15):** within a host era, partition width into one lane per assigned motif (allocate-slots-style); each motif anchors in its lane. Habitat Y anchored relative to `STRUCTURE_HEIGHT[worldScale]` (banner top = `roadBaseline − STRUCTURE_HEIGHT − margin`); road-foreground kinds near `roadBaseline`. Count-atoms lay left-to-right within the lane, clamped to `laneWidth / atomWidth`. Non-overlap enforced motif-vs-motif and motif-vs-era-edge only; motif-vs-structure overlap is intended composition.
  - **Spike monument (D16/D17):** baseline `{ camp: 0, town: 1, metropolis: 2 }`; a dimension spikes when `tier ≥ baseline + 2`. At most one monument = the single highest-reach spiking dimension in `ranked`; none if none clears (never fires at tier 0). Sets `standout: true` on that motif (render applies a fixed scale multiplier + gold accent). Lands in the widest era for free via the ordering.
  - **Plaques (D13):** compose `plaque` from `rawValue` via `compactCount` + suffix. Carriers: `stars → "4.8k ★"`, `pullRequests → "184 PRs"`, `issues → "312 issues"`, `forks → "N forks"`, `followers → "N followers"` (crowd clamps at `MAX_CROWD_FIGURES`, plaque carries the true count). Boulevard `banner` carries a plaque (`"12 languages"`) **only when** `distinctLanguages > MAX_BOULEVARD_BANNERS`; the dominant-language banner carries its `label` (language name), not a digit.
  - **Caps (D22):** named constants local to this module — `MAX_CROWD_FIGURES = 6`, `MAX_BOULEVARD_BANNERS = 8` (draw `min(distinctLanguages, 8)`).

**Test cases.** Per-profile: star-heavy → a `crownGate` with `standout: true` and a `"N ★"` plaque in the widest era; pr-heavy → a `bridge` with `"N PRs"`; polyglot → a `banner` boulevard, count = distinct languages (no plaque when ≤ 8). modest → ≥ 1 motif. brand-new / single-contribution → exactly one neutral hopeful motif, no plaque, hosted in the single present-day era. Spike: fires at gap exactly +2, not at +1 (inline builder). At most one `standout` across the scene. Boulevard: `distinctLanguages = 9` (inline) → clamped to 8 atoms + `"9 languages"` plaque. Lanes: no two motifs in an era overlap; every motif within its era's x-span. Determinism: `placeMotifs` idempotent (`toEqual` re-run).

**Commit plan.**
1. `test: pin motif distribution, geometry, spike, and plaques`
2. `feat: place strength motifs across eras`
3. (if the function grows) `refactor: split motif kind-map and plaque derivation`

## Phase 6 — Motif modules

Six atomic single-silhouette shapes, each budget-bounded, reusing `outlined-shape.ts` primitives.

- **`modules/banner.ts`**, **`crown-gate.ts`**, **`side-road.ts`**, **`crowd.ts`**, **`bridge.ts`**, **`notice-board.ts`** — each `(opts: { fill, heightScale }) → string`, drawn in the normalized box (x 0..1, y 0..−heightScale, standing on y=0), single atom (one banner, one gate ornament, one figure, one span, one board, one road segment). Multiplicity is Phase 7's job.
- **`mural-vocabulary.ts`** — add a `MODULE_PATH_BUDGET` entry per module (each a small element count; keep silhouettes simple per §6.9).

**Test cases.** Extend `modules.test.ts`'s `describe.each`: each new module renders valid elements, stays inside the normalized local box, honors its `MODULE_PATH_BUDGET` element cap, uses only the passed fill (neutralized-fill check), and carries the fixed thin outline.

**Commit plan.**
1. `test: pin motif module primitives and path budget`
2. `feat: add motif module silhouettes`

## Phase 7 — Motif render layer

Draws the placed motifs; maps language name → accent here (color is a render concern, per Stage 1).

- **`layers/motifs.ts`** — `renderMotifs(eras, worldScale): string`. For each era's `motifs`, draw the module by kind inside its lane, sized by tier (count-atoms repeated left-to-right up to the clamp; scale-driven kinds via the `<g scale>` wrapper). `standout` motifs get the fixed scale multiplier + `GOLD_ACCENT`. `crownGate` uses `GOLD_ACCENT`. Banners map `label` → `LANGUAGE_ACCENT[label] ?? structureAccent`; the dominant-language banner recurs across eras. Plaques drawn via the shared `svg-text` primitive, escaped, small caps digits.
- **`render-mural-svg.ts`** — insert `renderMotifs(scene.eras, scene.worldScale)` **after** `renderStructures`, **before** `renderRibbon`.

**Test cases.** Structural assertions (not a full-SVG snapshot): a star-heavy render contains a gold-accented standout element and its `"N ★"` plaque text; a follower-heavy render draws exactly `min(count, 6)` crowd atoms; a polyglot render draws `min(distinctLanguages, 8)` banners; the dominant-language banner's accent = `LANGUAGE_ACCENT[name]`; an unknown language falls back to the neutral accent. Layer order: motifs appear after structures, before ribbon, in the output string. Escaping: XML-hostile handle/label safe.

**Commit plan.**
1. `test: pin motif render layer and accent lookup`
2. `feat: render strength motifs over the mural`

## Phase 8 — Badge finale render layer

- **`layers/badge-finale.ts`** — `renderBadgeFinale(scene): string`. A flat panel (rounded rect + thin outline + warm fill), content-sized (**not** era-clamped), anchored at the present-day / right region in the sky band (~y 70–150, clearing era titles at y 52 and metropolis rooftops at ~y 172). Badges as Title-Case text separated by `·`, via the shared `svg-text` primitive, escaped. Optional per-badge plaque appended.
- **`render-mural-svg.ts`** — insert `renderBadgeFinale(scene)` after text (topmost, the climax panel).

**Test cases.** Panel present for every profile including brand-new (`The Journey Begins`). Badge labels appear as text in the output; separator `·` present for ≥ 2 badges. Panel geometry within the strip's right region and inside the y-band that clears titles and rooftops. Escaping safe. Single-badge accounts render one label, no dangling separator.

**Commit plan.**
1. `test: pin badge finale panel`
2. `feat: render present-day badge finale`

## Phase 9 — Integration, differentiation, and byte recalibration

Wire the two model passes into the scene, prove the done-when guarantees end-to-end, and re-set the byte ceiling.

- **`build-mural-scene.ts`** — call `placeMotifs` (attaching motifs to placed eras) and `deriveBadges` (setting `scene.badges`); everything else unchanged.
- **`index.ts` / `index-exports.test.ts`** — export the new public surfaces if the export test requires it.
- **Byte ceiling (D23):** measure the worst-case dense render (rich-history / fifteen-year, metropolis, a spiking dimension, max motifs across eras, badge panel, all plaques) and set `MURAL_BYTE_CEILING` just above it. Update the comment honestly with the new margin and the retained explicit Stage-3 SMIL headroom. Not a round bump.

**Test cases (the done-when suite, D25).**
- **Cross-profile differentiation:** load polyglot / star-heavy / pr-heavy / modest and assert their top-motif kind **and** lead badge are pairwise distinct.
- **Never-shaming:** no motif and no badge for a tier-0 weak dimension beyond the guaranteed `ranked[0]` slot; there is no "weakness" element in the model.
- **Feel-good floor:** modest and single-contribution each yield ≥ 1 motif **and** ≥ 1 badge.
- **Escaping + determinism:** dense render through `expectEmbedSafeSvg` with an XML-hostile handle; byte-identical re-render pin on a motif-heavy fixture; whole-scene determinism (`toEqual` re-run).
- **Byte ceiling:** the recalibrated dense render stays under `MURAL_BYTE_CEILING`.
- **Stage-1 non-regression:** the cosmic embed and Stage-1 mural goldens are byte-identical (motifs/badges appear only via the enriched `renderMural`; `?preview=mural` surface unchanged).

**Commit plan.**
1. `test: pin motifs, badges, differentiation, and byte ceiling end to end`
2. `feat: wire motifs and badges into the mural scene`
3. `chore: recalibrate mural byte ceiling for strengths layer`

## Named risks

- **Cross-dimension calibration.** Whether a stars-tier-3 and a PRs-tier-3 read as comparably notable depends on `tier-thresholds.ts` (a Stage-0 named risk) and the per-kind scale mapping here. Verified against the calibrated fixtures during Phase 5/7, not asserted as an absolute.
- **Language-accent legibility.** Muted-but-distinct hues on terracotta is a taste call; the `0.5` specialist gate and the accent tones are calibration defaults set during implementation and checked against real handles, not blocking open questions.
- **Byte growth vs Stage-3 headroom.** Motif atoms plus the badge panel push the dense render up. The caps (`MAX_CROWD_FIGURES`, `MAX_BOULEVARD_BANNERS`, `MODULE_PATH_BUDGET`, `MAX_SLOT_COUNT`, badge ≤ 4) bound the worst case; Phase 9 confirms the measured ceiling retains stated SMIL headroom.

## Open questions

None. All Stage-2 design decisions were resolved in the design dialogue. The two calibration defaults (language-accent tones, the `0.5` specialist `repoShare` gate) are set and verified during implementation, not deferred.

## Out of scope

- Animation of any kind (Stage 3).
- River and mountain worlds (Stage 4).
- The row-wrapped static export (Stage 5).
- Whole-world recolor by dominant language — dropped by design, not deferred; the recurring accented banner is the permanent answer.
- Collaborator / contributed-to motifs (excluded from the product).
- Flipping the live default off the cosmic render (Stage 6).
