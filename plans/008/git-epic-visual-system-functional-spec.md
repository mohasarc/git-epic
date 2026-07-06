# git-epic visual system functional spec

> Supersedes the render layer described in [`plans/000/git-epic-functional-spec.md`](../000/git-epic-functional-spec.md) §6 and Amendment 1 (the cosmic/starfield look). The data layer of the 000 spec — mechanical generation, determinism, public-data-only, the chapter/timeline engine — still holds and is referenced, not replaced. This document is the source of truth for **what the epic looks like and how it behaves visually**. It defines product behavior only and avoids implementation choices.

## Reference images

These set the target style and layout. They are visual guidance, not pixel specs. Style and exact composition are still tentative; the *behavior* below is what's fixed.

| Image | Use it for | Do NOT use it for |
|---|---|---|
| [`01-flat-mural-style.png`](reference-images/01-flat-mural-style.png) | The committed style: flat vector, thin dark outline, warm limited palette, flat fills, silhouette figures. The ancient→classical→ruins→modern arc. | — |
| [`02-flat-mural-variant.png`](reference-images/02-flat-mural-variant.png) | Same style, a second read on density and the silence stretch. | — |
| [`03-river-world-with-numbers.png`](reference-images/03-river-world-with-numbers.png) | A second world family (river/harbor). Numbers on objects (`RIVERCACHE`, contributors board). | The contributors board — collaborator data is **out of scope** (see §4). |
| [`04-industrial-world-decay-arc.png`](reference-images/04-industrial-world-decay-arc.png) | A rise-then-quiet arc ending on a *quiet* present day. Decay reserved for earned silence. | — |
| [`05-achievement-card-badges.png`](reference-images/05-achievement-card-badges.png) | The number-plaques and the closing **badge finale** (Explorer, TS Specialist, Heavy PR Contributor…). The strongest reference for how strengths surface. | The "76 collaborators" panel — out of scope. |
| [`00-painterly-moodboard-NOT-target.png`](reference-images/00-painterly-moodboard-NOT-target.png) | Mood/ambition only. | **The render target.** Painterly gradients are unbuildable as modular animatable SVG. Do not chase this look. |

---

## 1. Goal

The epic is a single horizontal illustrated mural of a developer's public GitHub history, rendered as an animated SVG for a profile README. A camera travels the mural left→right — the far left is the developer's origin, the far right is present day — dwelling on each era long enough to read it, then zipping to the next. It reads as one continuous journey through a changing world, not a slideshow of separate cards and not a stat dashboard. A second, static image export exists for sharing off-GitHub. Everything is generated mechanically from public GitHub data — no LLM anywhere. This spec defines product behavior only and avoids implementation choices.

## 2. Primary User

A developer embedding their own epic in their GitHub README. Default experience: open the generator page, type a handle, optionally pick a world variation, copy one markdown snippet, paste it. The embed replays on every page load and updates itself as their history grows. No sign-in, no maintenance.

Secondary consumer: a visitor to someone else's profile. The replay plays on load, settles on a living present-day scene, and the image links back to the generator.

Third: someone sharing their epic off-GitHub (X, Slack, a blog). Their experience is the **static image export** — the same world, laid out as stacked rows instead of a pan.

## 3. Core Guarantees

### 3.1 Distinctness comes from data, never from engineered novelty

The visual difference between two epics is a consequence of their histories differing. The system does not manufacture difference for its own sake.

```text
Two users with genuinely similar GitHub histories produce genuinely similar epics.
Randomness is seeded from the handle and only breaks ties between interchangeable
choices (which of several equivalent silhouettes, exact prop placement). It never
drives what an epic says about the user.
```

Correct behavior: two accounts with the same dominant language, similar star totals, and similar activity shapes look alike — same world scale, same landmark types, same density. They differ only in labels (real repo names, real numbers) and cosmetic seed jitter. There is no "make it look different" override.

### 3.2 Determinism (extends 000 §3.2)

The same GitHub data plus the same chosen variation always produces the identical image, byte-for-byte.

```text
render(handleData, variation) is a pure function. The variation is carried in the URL,
not in server state. Output changes only when the underlying data or the chosen
variation changes.
```

The variation replaces the old "seed picks everything" model: the user's chosen world is an explicit input; when omitted, it defaults to a hash of the handle. There is no cache-busting parameter that alters output.

### 3.3 The world is honest about scale, never shaming about size

Achievement level is legible at a glance — a rich history obviously outshines a modest one — but a modest history is never rendered as failure.

```text
Tier reads through SCALE and GRANDEUR: a great profile is a sprawling modern
metropolis; a modest profile is a humble frontier camp at dawn. Both are complete,
intentional, finished images. Decay and ruins are NOT how small histories look —
they are reserved for EARNED silence (a user who was active, then went quiet).
```

- A low-activity account → a small, alive, hopeful scene (camp, dawn, one marker, one banner). Never empty, never broken, never ruins.
- A once-thriving account gone silent → a large, decayed scene (the earned dark age).
- **No-override clause:** small never renders as decayed. `small + hopeful` and `big + decayed` are the only combinations; `small + decayed` is not produced unless the data earns it.

### 3.4 Every account gets a dignified minimum (grace floor, extends 000 §3.6)

```text
Even a single-commit account renders a complete, composed scene: a camp, one marker,
one language banner, a title, a subtitle, and a contribution ribbon. Never an empty
canvas, never a partial scene.
```

### 3.5 Feel-good is the emotional contract

The epic's job is to reflect real strength back and make the developer feel accomplished.

```text
Every epic surfaces at least one thing the user is strongest at, even when every
metric is modest (their personal top dimension, relative to their own other
dimensions). No epic is a list of shortfalls.
```

### 3.6 Self-contained animation (extends 000 §3.5)

```text
All motion is baked into the SVG (SMIL/CSS). Nothing is server-driven. The image
plays identically whether loaded from GitHub's proxy, saved to disk, or opened
directly. JavaScript is never required to animate.
```

The static export carries zero animation and is the reduced-motion fallback.

### 3.7 Public data only (unchanged from 000 §3.4)

No authentication. Private repos, private contributions, and email-identified activity never appear.

## 4. Scope

**In this version:**

- One horizontal panning-mural SVG per handle.
- One static image export (stacked rows) per handle.
- 3 world families: **desert**, **river**, **mountain**.
- 3 architecture tiers per world — **ancient → classical → modern** — advancing with real time along the journey.
- Story from two signals: **temporal chapters** (existing engine) and **standout strengths**.
- Strength dimensions: dominant language, language breadth (polyglot), project count, stars, forks, followers, PRs opened, issues opened, plus activity shape (streaks, silences, abundance years, recency).
- A closing **badge finale** naming the user's top strengths.
- URL-parameter variation picker (world), defaulting to a hash of the handle.
- A contribution ribbon (real per-day activity) along the bottom of the mural.

**Explicitly excluded (cut is cut — no v2):**

- Collaborator / contributor graphs and any "N people you worked with" motif. The data is expensive and fuzzy; the motif is dropped, not approximated.
- Attribution of contributions to *other people's* repos ("open-source contributed-to" roads). Not derivable from available data.
- A separate stats-card product. Numbers live inside the one mural and its badge finale.
- More than 3 world families. More than 3 architecture tiers.
- User-picked palette / time-of-day / tone / mascot toggles. The only variation knob is world.
- Painterly / gradient-heavy art. Continuous constant-speed panning (replaced by dwell-and-zip).
- Any LLM in the pipeline.

## 5. Interaction Model

The image is addressed by handle, with an optional world variation:

```text
https://git-epic.dev/<handle>.svg              → panning mural, world = hash(handle)
https://git-epic.dev/<handle>.svg?world=river  → panning mural, chosen world
https://git-epic.dev/<handle>.png              → static row-wrapped export
https://git-epic.dev/<handle>.png?world=desert → static export, chosen world
```

- `world` accepts exactly `desert`, `river`, `mountain`. Any other value, or omission, falls back to `hash(handle)`.
- The bare `<handle>.svg` with no parameters always produces a full epic — a variation is never required.
- Handle casing follows the 000 spec (canonicalized).
- The URL is the entire input and the cache key. **No server-side per-user state exists.**

Once a world is chosen, world family stops signalling anything about the user — it is pure taste. Newness, size, and strength are shown only through content (density, scale, ribbon), never through which world was picked.

## 6. Visual Grammar

### 6.1 The mural

One continuous horizontal strip. The left edge is origin; the right edge is present day. A single continuous **road or river** threads the entire width and never breaks — it is the spine of the journey and the top edge of the ribbon. Eras are stretches of that road, not separate panels. Seams between eras are soft dissolves (one district fades into the next), never hard cuts.

The mural is composed in layers, back to front:

```text
sky (one soft gradient allowed here, and only here)
distant terrain / horizon
the continuous road/river + ground plane
landmarks (buildings, monuments) on typed slots
props (banners, trees, boats, carts, cranes, crowds, lanterns)
overlays (dust, fog, glow, weather) — only when an era calls for them
the contribution ribbon (bottom band)
text (chapter title, subtitle, number-plaques)
```

### 6.2 Worlds and architecture tiers

World family is fixed for the whole mural (chosen or hash-defaulted). Within it, the *architecture tier advances with real time* as the camera moves right:

```text
early history  → ancient   (mudbrick, camp, first stone)
mid history    → classical (domes, marble, arches, harbors)
recent history → modern    (glass towers, cranes, contemporary blocks)
```

- The *fact* of progression is universal — everyone advances ancient→modern, because it encodes time. The *materials* come from the chosen world (desert mudbrick→glass; river harbor→port; mountain stone→terraced modern).
- Present day is instantly legible as "now" because it is rendered in the modern tier.

### 6.3 Tier legibility (the money-shot rule)

The overall scale of the world is driven by a composite of the user's dimensions:

```text
low composite    → humble frontier camp, dawn, few short structures, sparse
mid composite    → a real town, classical tier, moderate density
high composite   → sprawling modern metropolis, tall towers, gold, crowds
```

On top of overall scale, a user's **spike dimensions** get standout monuments: a low-composite account that is a strong language explorer gets a *small* world with *one* striking language-boulevard. Both truths are visible at once — small world, one thing that clearly shines.

### 6.4 The camera: dwell-and-zip

```text
Within an era: the camera drifts SLOWLY across the era's width (readable).
Between eras: the camera ZIPS — a fast smooth whip, never a hard cut. The road
blurs past during the zip, preserving continuity.
```

- Per-era beats (a crane lifting, a banner unfurling, dust sweeping in) and readable text fire during the **dwell**. During the zip, everything streaks by.
- Dwell duration is set per era-type: a boom era earns a longer drift (more to see), the silence is a deliberately slow but short lonely drift, a camp is a quick dwell.
- Wide eras are absorbed by the slow in-era drift — an era never has to fit one screen.
- Total replay is bounded ~12–18s, ending on the present-day dwell, which then **freezes** and hands off to the ambient loop.

### 6.5 Parallax and the ambient rest

- During travel, depth layers move at different rates (sky slowest, foreground props fastest) for a sense of depth.
- After the replay freezes on present day, local **ambient micro-loops** run forever: flags wave, water flows, glow pulses, torches flicker, faint crowd motion. This is the living final state a visitor mostly sees.
- The replay plays **once per page load**, then rests. It does not loop the whole journey — the story must arrive and stay arrived.

### 6.6 The contribution ribbon

A band along the bottom of the mural, made of the real per-day contribution counts (GitHub's green-square data), colored by density.

```text
The ribbon is the honest layer: it shows real activity for the whole history and is
never curated away. A spike of green sits directly under a boom era; a flat pale
stretch sits under the silence.
```

- In the **static export**, the ribbon shows the exact true activity chart.
- In the **panning SVG**, the ribbon may compress long spans (the mural is allowed to group multi-year periods into one era), but it still reflects real activity under each era — it is never faked.
- The ribbon carries the legend `Less activity … More activity`, matching the reference images.

### 6.7 Text layer

Three surfaces, terse:

```text
CHAPTER TITLE   — all caps, short era name        e.g. FLAGSHIP CITY
SUBTITLE        — one line, ≤ ~6 words, may name   e.g. OCTOCITY · 4.8k stars
                  real things
NUMBER-PLAQUES  — compact digits on objects        e.g. 184 PRs, 312 issues, 4.8k ★
```

- Visible text names **real** repos, languages, and numbers — this is what makes it the user's own saga.
- The grandiose-parody narration voice (from the existing narration engine) is repurposed as the SVG's accessibility description and shareable caption — the full prose lives in `<title>`/`<desc>`, not on the visible mural.
- **Text never gates a render.** Every era, strength, and badge has a generic safe-default line. An uncovered case renders a plain subtitle, never empty, never a crash.

### 6.8 The badge finale

The present-day dwell ends on a compact identity panel — the user's top strengths as titled badges, in the terse caps voice:

```text
TypeScript Specialist · Heavy PR Contributor · Prolific Builder · Explorer
```

- Badges are derived directly from the strength scores (§8.4). No new logic — labels on the top-N dimensions.
- This is the shareable money-shot and the natural end of the pan before ambient rest.

### 6.9 Style contract

```text
flat vector · thin dark outline · warm limited palette · flat fills · silhouette figures
gradients only in the sky · compact digit plaques · no baked raster · no external fonts
```

A hard per-module path budget is enforced so the whole strip (which ships in full even though only a slice shows at once) stays a GitHub-safe file size. Simpler silhouettes win over detail.

## 7. Cross-cutting Concerns

- **Determinism:** identical `(data, world)` → identical bytes. World defaults to `hash(handle)`.
- **Renderable always (000 §3.3):** unknown handle → "no such legend" card; upstream down with a cached epic → the cached epic; upstream down with no cache → "still being written" placeholder. Never a broken image.
- **Reduced motion:** the static export is the motion-free fallback; the animated SVG's frozen final frame is a valid still.
- **Accessibility:** the grandiose narration is exposed as `<title>`/`<desc>` so screen readers get the full story.
- **Data freshness:** the embed reflects the last successful snapshot; it updates as history grows, with no user action.
- **Attribution (000 §3.7):** permanent `Every contribution writes the story.` footer with the GitHub mark, as in every reference image.

## 8. Features

### 8.1 The panning-mural SVG

**Purpose:** the flagship README embed — the animated journey.

**Produces:** one SVG that, on load, plays the dwell-and-zip journey origin→present (~12–18s), freezes on the present-day badge finale, and runs ambient loops forever.

**Does not produce:** a looping full-journey replay, a server-driven animation, or a JS-dependent image.

**Example (embed):**

```markdown
![My GitHub Epic](https://git-epic.dev/mohasarc.svg)
```

**Defaults:** `world = hash(handle)`; replay plays once per load.

**Edge cases:** unknown handle → "no such legend"; zero-activity account → grace-floor camp; upstream failure → cached epic or "still being written".

### 8.2 The static image export

**Purpose:** shareable off-GitHub (X, Slack, blogs).

**Produces:** the same world as stacked horizontal rows (the mural wrapped like paragraphs), the exact true contribution ribbon under each row, all number-plaques and the badge finale, no animation. This is what the reference images literally depict.

**Does not produce:** motion, a pan, or a different story than the SVG — same data, re-laid-out.

**Example:**

```markdown
![My GitHub Epic](https://git-epic.dev/mohasarc.png?world=river)
```

**Edge cases:** same as 8.1, rendered as a still.

### 8.3 Temporal chapters (story signal 1)

**Purpose:** the moments that become eras along the road.

**Produces:** a curated, chronologically ordered set of eras (origin, first build, flagship rise, language era, great streak, prolificacy, dark age, present day — the existing chapter engine), each a stretch of the mural.

**Does not produce:** one era per calendar year — the mural may group multi-year spans into a single era; every candidate event — only the most dramatic are kept.

**Edge cases:** insufficient data for a chapter → the chapter is omitted, never improvised (000 §3.1).

### 8.4 Standout strengths (story signal 2)

**Purpose:** amplify what the user is strongest at.

**Produces:** per-dimension intensity from absolute **baseline tiers** (e.g. stars: lantern → gold banner → crown → ceremonial gate), plus a **relative guarantee** that the user's own top dimension is always highlighted even if below baseline. Strengths manifest as motifs and density inside eras, and as badges in the finale.

**Dimension → motif:**

```text
dominant language      → world tinted that color, that banner flies throughout
language breadth        → a boulevard of many banners; a district per language
project count           → dense skyline, many landmarks
stars                   → gold ornaments, crowns, ceremonial gates (by tier)
forks                   → branching side-roads / canals
followers               → onlookers / a gathered crowd near the flagship
PRs opened              → bridges (a PR connects two shores)
issues opened           → posted tablets / notice boards
activity volume/streaks → construction density, lit windows, a long lit road
```

**Does not produce:** collaborator or contributed-to-others motifs (out of scope, §4); a shaming visual for weak dimensions — weak dimensions are simply quiet, not called out.

**Edge cases:** every-dimension-modest account → the single relative-top dimension still gets a motif and a badge (feel-good contract, §3.5).

### 8.5 Worlds and the variation picker

**Purpose:** let the user choose the look; default sensibly.

**Produces:** one of desert / river / mountain, fixed for the whole mural, with ancient→classical→modern progression inside it.

**Defaults:** `hash(handle)` when `world` is absent or invalid.

**Does not produce:** a world that changes mid-journey; a world that encodes anything about the user (it is taste only).

### 8.6 The contribution ribbon

**Purpose:** the honest, full-history activity layer and the road's foundation.

**Produces:** a bottom band of real per-day counts with the density legend; exact in the static export, faithfully-under-each-era in the SVG.

**Does not produce:** a curated or faked activity chart.

### 8.7 The present-day badge finale

**Purpose:** crown the user with their titles — the shareable payoff.

**Produces:** a compact panel of top-N strength badges on the present-day dwell, terse caps voice, derived from §8.4 scores.

**Does not produce:** a full stats table; badges for dimensions the user is not strong in.

### 8.8 Generator page

**Purpose:** forge and copy an epic.

**Produces:** a handle input, a 3-way world picker (desert/river/mountain, or "auto"), a live preview, and one copy-paste markdown snippet.

**Does not produce:** sign-in, saved settings, or any server-side per-user state — the chosen world lives only in the copied URL.

## 9. Summary

| Feature | What it is |
|---|---|
| Panning-mural SVG | Flagship README embed: dwell-and-zip journey, freezes on badge finale, ambient loop |
| Static image export | Same world as stacked rows for off-GitHub sharing, exact ribbon, no motion |
| Temporal chapters | Curated dramatic eras along the road (existing engine) |
| Standout strengths | Baseline-tier + relative-guarantee amplification of what the user is best at |
| Worlds + picker | Desert / river / mountain, ancient→modern within; URL-param, hash default |
| Contribution ribbon | Honest full-history activity band; road's foundation |
| Badge finale | Top-N strength titles as the present-day payoff |
| Generator page | Type handle, pick world, copy one snippet — no accounts, no state |

**The one sentence:** a deterministic modular SVG that renders a developer's real GitHub history as one continuous illustrated journey — a camera dwelling on each era and zipping to the next, through a world that grows from ancient to modern and from humble to grand exactly as the data earns it, and crowns the developer with the strengths they actually have.
