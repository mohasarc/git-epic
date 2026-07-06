# Stage 4 · Phase 1 — world abstraction (byte-preserving refactor)

Phase 1 introduces the `World` bundle, the `worlds` catalog, and a `world` argument on
`renderMural`. `river` and `mountain` are desert aliases until their phases land, so every
world renders the exact desert bytes — a pure refactor, no pixel change.

## Input → output

```ts
import { renderMural } from 'git-epic';

renderMural(snapshot);              // desert (default)
renderMural(snapshot, 'desert');
renderMural(snapshot, 'river');     // aliased to desert in P1
renderMural(snapshot, 'mountain');  // aliased to desert in P1
```

`rich-history-account` fixture, all four calls:

```json
{
  "WORLD_NAMES": ["desert", "river", "mountain"],
  "defaultBytes": 73250,
  "perWorldBytes": { "desert": 73250, "river": 73250, "mountain": 73250 },
  "defaultEqualsDesert": true,
  "riverEqualsDesert": true,
  "mountainEqualsDesert": true
}
```

`WORLD_NAMES` is the frozen, append-only order the hash default keys off (`% 3`). The
rendered strip is byte-identical to the committed Stage-3 golden
(`examples/stage-3-phase-8/rich-history-account.svg`).
