# Phase 5 — motif placement sample

`placeMotifs(eras, strengths)` is a pure model pass; it attaches strength motifs to
placed eras. No SVG yet (render is Phase 7). `placed-motifs.json` is its output for a
few calibrated fixtures — the call a caller makes and the data they get back.

Read it as: each entry is a hosting era and the motifs placed inside it.

- `star-heavy` — stars tier-4 in a town spikes: a `crownGate` with `standout: true`
  and a `15k ★` plaque, landed in the widest era. Followers/PRs/forks/languages fan
  out across the remaining eras.
- `pr-heavy` — a `bridge` carrying `600 PRs`.
- `polyglot` — a boulevard `banner`, `count` clamped to 8 with a `9 languages` plaque
  (true count exceeds the banner cap).
- `modest` — its real strengths only, floored at one motif.
- `brand-new` — one neutral, plaque-free `banner` in the present-day era. No false
  titled strength, no `0 ★`.

Regenerate by running `placeMotifs` over the fixtures (see `place-motifs.test.ts`).
