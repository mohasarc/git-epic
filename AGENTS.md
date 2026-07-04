# git-epic contributor guide

## Orientation

`git-epic` renders a developer's GitHub history as an animated cinematic SVG — "The Epic of `<handle>`" — embeddable in profile READMEs. A replay of the career (chapters detected mechanically from public GitHub data, narrated in grandiose-parody templated text) settles into a living ambient state. No LLM at runtime; generation is deterministic per user.

Read [`plans/000/git-epic-functional-spec.md`](plans/000/git-epic-functional-spec.md) before changing behavior. That spec is the source of truth for behavior.

## TDD

Write the failing test first, then make it pass. Every behavior the package performs should have a test that would fail without it. Commit the red test as its own commit when the failure is informative; otherwise pair it with the implementation.

## Project rules

- Avoid comments unless a short comment saves a reader from tedious parsing of a genuinely complex block.
- Favor readable names, early returns, and simple control flow.
- Name what a value is, not the generic role it plays.
- Spell out abbreviations in directory and file names.
- Break large functions into smaller named functions.
- Prefer clear, small modules with explicit types at public boundaries.
- Reuse existing utilities before adding dependencies or new abstractions.
- Keep behavior deterministic: same user data in, same SVG out. Seeded randomness only.
- No LLM calls anywhere in the pipeline — all generation is mechanical.
- Rendering must be cache-friendly: SVG regenerates only when underlying data changes; animation is baked into the output (SMIL), never server-driven.
- Update docs and examples whenever user-visible behavior changes.

## PR descriptions

Use `.github/PULL_REQUEST_TEMPLATE.md` when opening PRs.

Writing rules:

- Conciseness is non-negotiable.
- One concrete fact per sentence or bullet.
- Prefer concrete nouns over hand-waving.
- Cut filler.
- Skip any section that would be empty or restate the title — except the two mandatory sections.
- Always include the "Output preview" (user input → output, rendered when visual) and "Where it lives" (file change tree) sections. Never skip these.
- Do not add a "Summary" / "What changed" section.

## Agent setup

Shared agent rules live in `.agents/rules/`.

Shared agent skills live in `.agents/skills/`.

Codex startup hooks live in `.codex/`.

Claude compatibility symlinks live in `.claude/`.
