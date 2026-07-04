# Stage 0 phased plan — art style selection

Phased implementation plan for [Stage 0 of the staged plan](../000/stages.md#stage-0--art-style-selection): choose the art style from rendered prototypes, amend the spec, restyle Stage 1's rendered surfaces. Behavior source of truth: [functional spec](../000/git-epic-functional-spec.md) §6.

## Goal

After all phases: three hand-built prototype SVGs live in `examples/stage-0-prototypes/`, each verified to animate through GitHub's camo proxy; the spec carries Amendment 1 naming the chosen style, its visual vocabulary, and the text-minimal storytelling rule; `renderEpicSvg` draws every grace-floor surface (title card, chapter scene, present-day card, ambient layer) in that style from a single vocabulary module; the repo README embeds the restyled example. Byte-determinism holds throughout.

## Context

Restyle surface is `src/rendering/render-epic-svg.ts` only — inline style constants at `:18-23`, `titleCardContent`, `chapterSceneContent` (subtitle caption at `:82`), `chapterSceneVisual`/`placeholderSceneVisual`, `presentDayCardContent`, `renderAmbientLayer`, starfield. Detection (`src/chapters/`), narration text (`src/narration/`), timeline and timing constants (`src/timeline/`), and fixtures stay untouched. Byte-determinism test (`src/render-epic.test.ts:25`) compares run-to-run, so restyling changes bytes without breaking it. Verification gate per phase: `pnpm test && pnpm lint && pnpm typecheck`.

Decisions this plan encodes (agreed in design dialogue):

- **Candidates.** universe-from-first-commit (spec's leading candidate, `spec §6`), illuminated-manuscript, constellation-cartography. The first and third double as a rich-vs-cheap SMIL-weight stress test; the second stress-tests the text-minimal rule.
- **Default pick with override window.** universe-from-first-commit is the working pick. The phase 2 PR is the decision point: its description states the default and how to override; reviewer silence ratifies it. An override reruns phases 3–4 against the chosen style; the cost is bounded to the amendment doc and the vocabulary module.
- **Prototype shape.** One animated SVG per style cycling title card → chapter scene → ambient frame via SMIL — proves surfaces and transition timing in one file. Each shows the narration caption as a styled composition element and the permanent attribution. Hand-built; image-generation tools allowed for ideation only, nothing generated or traced gets committed, ideation artifacts stay out of the repo (`temp/` is gitignored).
- **Camo verification.** Prototypes embedded via SHA-pinned `raw.githubusercontent.com` URLs in `examples/stage-0-prototypes/README.md`, viewed rendered on github.com (same camo pipeline as a profile README). Playwright: assert the `<img>` has nonzero natural dimensions (camo accepted it), then two element-scoped screenshots a few seconds apart within the first ~10 s differ (SMIL playing). Ad-hoc verification recorded in the PR's Output preview — not committed automation.
- **Amendment form.** New `## 10. Amendments` section appended to the spec; §6 gets a one-line pointer. Amendment 1 records: style name, visual vocabulary (palette, motifs, typography, style motion), the text-minimal rule (any text is a styled element of the composition, never a subtitle), and provenance (candidates, prototypes pointer, ratifying PR). Marked provisional until the phase 2 PR is approved.
- **Vocabulary boundary.** `src/rendering/visual-vocabulary.ts` holds style only: palette, typography, motif primitives, style-motion constants (twinkle rates, drift speeds). Replay schedule (3 s title, 3.5 s/chapter — spec-fixed) and canvas geometry (`CANVAS_WIDTH`, `CENTER_X`, `SCENE_CENTER_Y`) are structure and stay in `render-epic-svg.ts`.
- **XML well-formedness proxy.** No XML parser in the dependency tree and none gets added; the contract test asserts structure (root element, balanced `</svg>`, required attributes) and the github.com rendering check is the real parse gate.

Open questions:

- **The style pick is provisional.** Default universe-from-first-commit; the human overrides, if at all, by naming another candidate in phase 2 PR review. Phases 3–5 proceed against the default; an override reruns 3–4.

## Phases

## Phase 1 — Shared embed-safety helper

**Behavior delivered.** The embed-safety bar (no scripts, no external references, no event attributes) lives in one reusable helper instead of inline in `render-epic-svg.test.ts`, so prototypes and product output are held to the identical check.

**Test cases.** (unit, colocated)

- `expect-embed-safe-svg.test.ts`: accepts a minimal safe SVG; rejects `<script`, `@import`, ` onload=`-style attributes, and any `http(s)://` outside the xmlns declaration — one failing input per rule.
- `render-epic-svg.test.ts` embed-safety case (`:61-69`) rewritten to call the helper; assertions unchanged in effect.

**Components.**

```ts
// src/test-support/expect-embed-safe-svg.ts
/** Vitest assertion: SVG contains no scripts, external references, or event attributes. */
export function expectEmbedSafeSvg(svg: string): void;
```

**Commit plan.**

1. `test: cover embed-safety helper` — red test defining the helper's accept/reject contract. Test-first.
2. `feat: add expectEmbedSafeSvg test-support helper` — turns the test green. Production of the helper only, no callsites yet.
3. `refactor: use expectEmbedSafeSvg in render-epic-svg tests` — replaces the inline checks. Refactor only, no behavior change.

**Done when.** Both suites green via the helper; inline checks gone; gate passes.

## Phase 2 — Prototypes and camo verification (the decision PR)

**Behavior delivered.** Three committed candidate-style SVGs, each proven to load and animate through GitHub's camo proxy. This PR is the style decision point.

**Test cases.** (unit, `src/rendering/prototype-svgs.test.ts`, reading `examples/stage-0-prototypes/` — precedent for tests-in-src reading external data: `src/test-support/load-history-snapshot-fixture.ts`)

For each of the three named prototype files:

- Structure: file exists; single root `<svg` with `width="830"`, `height="415"`, `viewBox="0 0 830 415"`; document ends with `</svg>`; dark background present.
- Animation: contains SMIL `<animate` elements; contains `repeatCount="indefinite"` (ambient loop).
- Surfaces: title text ("THE EPIC OF"), a chapter-scene narration caption, ambient attribution ("The Epic of" + the credit line from `src/timeline/attribution.ts`'s `CREDIT_LINE`).
- Safety: `expectEmbedSafeSvg` passes.

**Components.**

```ts
// src/rendering/prototype-svgs.test.ts
const PROTOTYPE_STYLE_NAMES = [
  'universe-from-first-commit',
  'illuminated-manuscript',
  'constellation-cartography',
] as const;
```

- `examples/stage-0-prototypes/<style-name>.svg` × 3 — hand-built, each cycling title card → chapter scene → ambient frame via SMIL, caption as styled composition element, permanent attribution.
- `examples/stage-0-prototypes/README.md` — one section per candidate embedding its SHA-pinned raw URL, so viewing this file on github.com renders every prototype through camo.

**Commit plan.**

1. `test: define the prototype contract` — red test naming the three files and their required structure. Informative red commit: it fixes which styles exist and what each must contain before any art does.
2. `feat: add universe-from-first-commit prototype` — first prototype, its test cases turn green.
3. `feat: add illuminated-manuscript prototype` — second prototype.
4. `feat: add constellation-cartography prototype` — third prototype; suite fully green.
5. `docs: add prototypes README with camo embeds` — SHA-pinned embeds (pinned to the previous commit's SHA; adjusted after push if needed).

**Done when.** Suite green; each prototype verified on github.com per the camo procedure (nonzero natural dimensions, differing frames); PR description carries the verified SHA, per-prototype pass/fail, both frames, the default pick, and the override instructions.

## Phase 3 — Spec amendment

**Behavior delivered.** The spec records the chosen style, its visual vocabulary, and the text-minimal storytelling rule; every later rendering decision has a written visual target.

**Test cases.** None — document-only phase; the gate command still runs.

**Components.** In `plans/000/git-epic-functional-spec.md`:

- `## 10. Amendments` → `### Amendment 1 — Art style (provisional until the prototypes PR is approved)`: style name; visual vocabulary (palette, motif set, typography rules, style-motion character); text-minimal rule — minimal text, any text is a styled element of the composition, never a subtitle under a scene; provenance — three candidates, pointer to `examples/stage-0-prototypes/`, ratifying PR.
- §6 first paragraph gains one sentence pointing at Amendment 1.

**Commit plan.**

1. `docs: amend spec with the chosen art style` — the amendment plus the §6 pointer. One logical change.

**Done when.** Amendment present, §6 pointer present, gate passes.

## Phase 4 — Restyle the grace-floor surfaces

**Behavior delivered.** `renderEpicSvg` output reads in the chosen style: title card, chapter scene (caption composed, not subtitled), present-day card, ambient layer. Determinism intact.

**Test cases.** (unit, colocated)

- `visual-vocabulary.test.ts`: exports are non-empty, colors are hex, the background is dark (relative luminance below threshold) — the contract Stage 3 scenes will consume.
- `render-epic-svg.test.ts` additions/updates:
  - Caption-as-composition test: narration text present inside the chapter-scene group and carrying the vocabulary's caption styling — not the bare centered-subtitle pattern (`:82`). Exact assertion pinned during implementation once the style's caption treatment exists.
  - Existing structural cases (viewBox, hidden groups, ambient attribution, escaping) stay; assertions pinned to old visuals (colors, positions) updated.
- `render-epic.test.ts` byte-determinism cases: untouched, must stay green.

**Components.**

```ts
// src/rendering/visual-vocabulary.ts — exact keys settle against the chosen style
export const PALETTE: {
  background: string;
  starlight: string;
  text: string;
  dimText: string;
  accent: string;
};
export const TYPOGRAPHY: {
  fontStack: string;
  titleLetterSpacing: number;
  captionTreatment: string;
};
export const STYLE_MOTION: {
  twinklePeriodSeconds: number;
  ambientDriftSeconds: number;
};
```

`render-epic-svg.ts` drops its inline constants (`:18-23`) in favor of the module; `placeholderSceneVisual` stays (Stage 3 replaces it per chapter kind) but restyled; replay schedule and canvas geometry do not move.

**Commit plan.**

1. `feat: add visual-vocabulary module` — vocabulary test then module, type-only-plus-values, no callsites yet.
2. `refactor: point render-epic-svg at the vocabulary` — swaps inline constants for module imports, zero visual change (same values). Refactor only.
3. `test: pin the restyled surface contract` — red cases for caption-as-composition and the new style's observable properties.
4. `feat: restyle grace-floor surfaces to the chosen style` — vocabulary values and renderers change together; red cases green; old visual assertions updated in the same commit they break.

**Done when.** All suites green including untouched byte-determinism; rendered fixture eyeballed via `pnpm render-fixture`; gate passes.

## Phase 5 — Examples and README

**Behavior delivered.** The repo showcases the restyled output: regenerated committed example, epic embedded at the top of the repo README, verified animating on github.com.

**Test cases.** None new — `scripts/render-fixture-to-svg.ts` output is covered by the determinism suite; this phase commits its artifacts.

**Components.**

- `examples/stage-0-phase-5/rich-history-account.svg` — regenerated via `pnpm render-fixture test-fixtures/rich-history-account.json`, plus a `.scene.png` still (precedent: `examples/stage-2-phase-6/`).
- `README.md` — restyled example embedded at the top via relative path; Stage 2 usage sections unchanged (they show code and text output only).

**Commit plan.**

1. `docs: add restyled example render` — the regenerated svg + png artifacts. One logical change.
2. `docs: embed the epic in the README` — the embed. Separate from artifact generation.

**Done when.** README on github.com shows the epic animating (camo procedure from phase 2, applied to the README embed); artifacts byte-match a fresh render; gate passes.

## Out of scope

- Scenes for the six non-Origin chapter kinds — Stage 3 (`plans/000/stages.md` §Stage 3), which consumes the vocabulary module.
- Detection, narration text, timeline, timing, fixtures — locked by Stages 1–2; Stage 0 touches rendering only.
- Committed browser-verification automation — verification stays ad-hoc and recorded in PR descriptions; a reusable harness is Stage 3's concern if scenes need it.
- Spec Amendment 2 (final name and domain) — closing stage.
