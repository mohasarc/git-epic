# git-epic functional spec

## 1. Goal

`git-epic` turns a developer's public GitHub history into "The Epic of `<handle>`" — an animated cinematic SVG that replays their career as a grandiose-parody saga, then settles into a living ambient scene. It lives in profile READMEs as an image embed and is generated entirely mechanically from public GitHub data — no LLM anywhere in the pipeline. It competes for the same README real estate as github-readme-stats and contribution-snake, but is a story, not a stat card. It is not a repo-health tool, not an analytics product, and not a video generator. This spec defines product behavior only and avoids implementation choices.

Working name is `git-epic`; final name and domain are pending. Examples below use `git-epic.dev` as a placeholder.

## 2. Primary User

A developer embedding their own epic in their GitHub profile README. Their default experience: visit the generator page, type their handle, watch their epic render, copy one markdown snippet, paste it into their README. No sign-in, no configuration, no maintenance — the embed updates itself as their history grows.

Secondary consumer: a visitor viewing someone else's profile. Their default experience: the replay plays on page load, the ambient state follows, and clicking the image leads to the generator page where they can forge their own.

## 3. Core Guarantees

### 3.1 Fully mechanical generation

Every element of the epic — chapter selection, narration text, visuals, timing — is derived by fixed rules from public GitHub data.

```text
No LLM or other non-deterministic generator participates in producing any epic. All narration is assembled from a fixed template catalog.
```

There is no "AI-enhanced" mode. Correct failure behavior: if a rule cannot produce a chapter (insufficient data), the chapter is omitted — never improvised.

### 3.2 Determinism

The same underlying GitHub data always produces the identical SVG, byte-for-byte.

```text
render(handle, data) is a pure function. Any randomness is seeded from the handle. Layout changes only when the underlying data changes.
```

Two consecutive requests without a data change return the same document. There is no cache-busting parameter that alters output.

### 3.3 Every response is a renderable image

Any request to the image endpoint returns a valid SVG that displays correctly inside a GitHub README, regardless of upstream state.

```text
The image endpoint never returns a broken image: unknown handles, upstream outages, and rate-limit exhaustion all produce a designed SVG state.
```

Correct failure behaviors:

- Nonexistent handle → "no such legend" card.
- Upstream data unavailable, cached epic exists → the cached epic, however old.
- Upstream data unavailable, no cached epic → "the epic is still being written" placeholder that asks the viewer to return shortly.

There is no error state that renders as a broken `<img>`.

### 3.4 Public data only

Epics are built exclusively from data visible to a logged-out GitHub visitor.

```text
No user authentication exists. Private repositories, private contributions, and email-identified activity never appear in an epic.
```

There is no opt-in to include private data. Correct behavior for a user whose activity is mostly private: their epic reflects only the public remainder (see grace floor, 3.6).

### 3.5 Self-contained animation

All motion is baked into the SVG document itself and plays wherever GitHub renders images.

```text
The SVG animates without scripts, external requests, or viewer interaction. It plays inside GitHub's image proxy sandbox.
```

Every page load restarts the animation from the title card. There is no interactive variant.

### 3.6 Grace floor

Every valid handle gets a presentable epic, however small the history.

```text
A handle with a single public contribution still receives a title card, an origin chapter, and a dignified ambient state.
```

A brand-new account renders "the epic has just begun" as its sole chapter. There is no minimum-activity rejection.

### 3.7 Attribution is permanent

The ambient state always carries the credit line identifying the subject and the generator.

```text
Every epic displays "The Epic of <handle>" and a "forge yours" credit. No parameter removes it.
```

There is no white-label override.

## 4. Scope

Included in v1:

- Image endpoint rendering a user's epic as animated SVG.
- Replay sequence: title card → chapters → present-day card.
- Ambient state following the replay, looping indefinitely.
- Mechanical chapter detection from public history.
- Grandiose-parody narration from a fixed template catalog.
- Generator page: handle input, live preview, copy-snippet.
- Embed snippet: image wrapped in a link to the generator page.
- Single dark art style.
- Freshness: at most 24 hours behind live GitHub data.
- Open-source repository from day one.

Explicitly excluded from v1:

- Repo epics (an epic for a repository rather than a user).
- Organization accounts (an org handle renders the "no such legend" card).
- Any LLM-generated content.
- Video/GIF/MP4 export.
- Theme, color, or size parameters; light mode.
- Localization; narration is English only.
- User authentication; private-data inclusion.
- Viewer-specific personalization of any kind.
- Cross-user interaction (visits, comparisons, leaderboards).
- Analytics, tracking pixels, or view counting.
- Editing, hiding, or reordering chapters.

## 5. Interaction Model

Two addresses, both unauthenticated GETs:

**Image endpoint** — the epic itself:

```text
https://git-epic.dev/<handle>.svg
```

- `<handle>` is a GitHub login. Case-insensitive; rendered with GitHub's canonical casing.
- No other parameters are accepted in v1. Unknown query parameters are ignored, never errors.
- The URL is guessable: changing the handle is a complete, supported way to generate any epic.

**Generator page** — the human entry point:

```text
https://git-epic.dev/            landing + handle input
https://git-epic.dev/?u=<handle> landing with the preview pre-rendered
```

**Embed snippet** — what users paste into their README (the copy-snippet output, exactly):

```markdown
[![The Epic of mohasarc](https://git-epic.dev/mohasarc.svg)](https://git-epic.dev/?u=mohasarc)
```

Not accepted: POST requests, handle lists, org handles, repo paths (`owner/repo`), and email addresses.

## 6. Visual Grammar

> Superseded by plans/008 (2026-07-06) — the cosmic/starfield look is retired; see the visual-system spec. This section is kept as a historical record.

The art style (leading candidate: a universe forming from the first commit) is selected from rendered prototypes and documented as an amendment here; the structure below is style-independent and fixed. The chosen style is recorded in [Amendment 1](#amendment-1--art-style-provisional-until-the-prototypes-pr-is-approved).

**Canvas**: 830 × 415, dark background. Scales down proportionally when the README column is narrower.

**Replay** (plays once per page load, ≤ 35 seconds total):

1. **Title card** — "THE EPIC OF `<HANDLE>`" with the account's origin year. 3 seconds.
2. **Chapters** — chronological, each a scene with a narration caption. 3.5 seconds each, at most 8 chapters.
3. **Present-day card** — a closing beat marking "now".

**Ambient state** (after the replay, loops forever): the accumulated present-day scene with slow idle motion — the epic reads as alive, not as a repeating GIF. Carries permanently:

- "The Epic of `<handle>`"
- credit line: `✦ forge yours at git-epic.dev`

**Narration voice**: deadly serious epic register about mundane dev life. Examples of the register (template outputs, not literal fixed strings):

```text
In the year 2019, the developer forsook JavaScript, and there was much refactoring.
And lo, symnav rose from nothing, and a hundred stars gathered to witness it.
Then came the Dark Age: one hundred and forty days, and not a single commit.
```

## 7. Cross-cutting Concerns

- **Freshness**: a rendered epic is served from cache for 24 hours, then regenerated on the next request. No push updates; no manual refresh endpoint.
- **Staleness over failure**: when fresh data cannot be fetched, the most recent cached epic is served without expiry.
- **Placeholder retry**: the "still being written" placeholder instructs caches to retry after 5 minutes.
- **Chapter ordering**: strictly chronological. Ties broken deterministically by chapter-type precedence.
- **Timezone**: all dates interpreted in UTC.
- **Numbers in narration**: spelled per epic register ("a hundred stars"), with exact values only where drama needs them.
- **Concurrent viewers**: unlimited; every viewer of the same epic within the freshness window sees the identical document.

## 8. Features

### 8.1 The epic image

**Purpose**: render one user's history as the animated epic.

**Produces**: one SVG conforming to the visual grammar — replay then ambient, chapters detected from the user's public history.

**Does not produce**: JSON, HTML, stats data, or any second format; no per-viewer variation.

**Chapter catalog** (all detection is mechanical; a chapter appears only when its rule fires):

| Chapter | Fires when | Narrated as |
| --- | --- | --- |
| Origin | first public activity | the beginning of the saga |
| Language era | dominant language of a period changes | forsaking one tongue for another |
| Flagship rise | a repo crosses 100 stars | the rise of a named creation |
| Star milestone | cumulative stars cross 100 / 1,000 / 10,000 | gathering renown |
| The Dark Age | ≥ 180 consecutive days without public contributions | the great silence |
| The Great Streak | longest streak ≥ 30 consecutive days of contributions | the relentless campaign |
| Prolificacy | a calendar year's contributions ≥ 2× the prior year's | the year of abundance |

**Defaults**: max 8 chapters (when more fire, keep the 8 most dramatic by fixed precedence: Origin, Flagship rise, Dark Age, Language era, Star milestone, Great Streak, Prolificacy — then earliest first); Dark Age threshold 180 days; streak threshold 30 days; flagship threshold 100 stars.

**Edge cases**:

- Zero chapters beyond Origin → grace-floor epic (3.6).
- Handle not found on GitHub → "no such legend" card.
- Handle is an organization → "no such legend" card.
- Renamed account → old handle renders whatever GitHub resolves it to; no redirect logic.
- History spanning 15+ years → same 8-chapter cap; the replay does not lengthen.

### 8.2 Generator page

**Purpose**: let a visitor create and copy their own epic in under a minute.

**Produces**: a handle input, a live preview of the resulting epic (the real image endpoint output, not a mock), and a copy button yielding the exact embed snippet from section 5.

**Does not produce**: accounts, saved galleries, edit controls, or share-to-social integrations.

**Defaults**: empty input on landing; `?u=<handle>` pre-fills and pre-renders.

**Edge cases**:

- Invalid handle syntax → inline message, no request issued.
- Valid-syntax unknown handle → the "no such legend" card as the preview, so the user sees exactly what an embed would show.

### 8.3 Embed behavior on GitHub

**Purpose**: the epic behaves correctly where it actually lives.

**Produces**: a replay on every profile page load, ambient state thereafter, and a click-through to the generator page pre-filled with the subject's handle (`?u=<handle>` — the viewer lands one edit away from their own).

**Does not produce**: hover effects, sound, or any interaction inside the image; no layout shift (dimensions are fixed in the SVG).

**Edge cases**:

- GitHub light mode → the dark canvas renders as an intentional cinema frame; no light variant exists in v1.
- GitHub's image proxy caching → freshness may lag up to the proxy's own cache window on top of the 24-hour window; the product promises "roughly daily", not real-time.

## 9. Summary

| Feature | One line |
| --- | --- |
| Epic image | Animated SVG replaying a user's public GitHub history as a parody saga, settling into a living ambient scene |
| Generator page | Type a handle, watch the epic render, copy the embed snippet |
| Embed behavior | Replay per profile visit, permanent attribution, click-through that seeds the viral loop |

## 10. Amendments

### Amendment 1 — Art style (provisional until the prototypes PR is approved)

> Superseded by plans/008 (2026-07-06) — the cosmic/starfield look is retired; see the visual-system spec. This amendment is kept as a historical record.

**Style**: universe-from-first-commit. The epic is a universe forming from the first commit: the origin renders as a golden spark whose expanding rings, orbiting bodies, and nebula glow accumulate into the present-day cosmos.

**Visual vocabulary**:

- **Palette**: near-black space background `#070b14`; indigo nebula depths `#2b2a5e` → `#1a1c3f`; gold origin spark `#ffd27d` warming to `#ffb45e`; gilded text gradient `#f7ecd0` → `#d9b45b`; starlight `#dbe6ff`; cool accent bodies `#9ad2ff`, `#9aa8ff`, `#f0c9ff`; muted metadata `#8b93a7`.
- **Motifs**: static starfield of sub-1.5px stars; radial nebula glow centered on the scene; a glowing core (spark-glow halo around a solid gold nucleus); expanding rings that fade as they grow; orbiting bodies on rotate transforms; thin gold rules with fade-out ends flanking ornament dots.
- **Typography**: Georgia / Times New Roman serif throughout. Title in gilded-gradient bold caps with wide letter-spacing; narration in gilded italic; metadata (est. year, attribution) small in muted `#8b93a7`.
- **Style motion**: replay beats are one-shot `fill="freeze"` animations (ring expansion, scene cross-fades); ambient state loops slow indefinite motion — multi-second star twinkle, ~7 s core pulse, 14 s+ orbit periods, a 60 s dashed halo rotation. Motion reads as drift, never as a spinner.

**Text-minimal rule**: minimal text; any text is a styled element of the composition — gilded, letter-spaced, flanked by rules — never a subtitle under a scene.

**Provenance**: three candidates — universe-from-first-commit, illuminated-manuscript, constellation-cartography — prototyped in [`examples/stage-0-prototypes/`](../../examples/stage-0-prototypes/) and verified to animate through GitHub's camo proxy. Ratifying PR: [#18](https://github.com/mohasarc/git-epic/pull/18); reviewer silence ratifies the default, an override there reruns the style-dependent phases.
