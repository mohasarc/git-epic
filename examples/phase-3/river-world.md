# Stage 4 · Phase 3 — river world

The river world overwrites its Phase-1 desert alias with a real bundle: cool blue-green
palette, harbor→port materials, a dock-hut ancient opener, a moored-boat prop, and a flowing
water spine. Same scene data reads the same as in desert — only color and the two signatures
change.

## Input → output

```ts
import { renderMural } from 'git-epic';

renderMural(snapshot, 'river');
```

`mohasarc-captured` fixture in the river world → [`mohasarc-captured.river.svg`](./mohasarc-captured.river.svg).

## What river changes

- **Spine.** The desert road becomes a continuous water band at `Y_BANDS.roadBaseline`; its
  bottom edge holds the ribbon-top baseline, so ribbon geometry is untouched. In the animated
  render a drifting current line (`stroke-dashoffset` loop, `repeatCount="indefinite"`) rides
  the waterline — a world-level flow gesture owned by the spine layer, sibling to the motif
  ambient loops. Water that doesn't move reads broken.
- **Signatures.** Camp module = dock hut; prop module = boat. Classical/modern buildings stay
  the shared `structure` module, recolored — harbors are river's material flavor, not new shapes.
- **Palette.** Cool sky, teal ground/structure tiers, cool ribbon ramp, cool language accents.

## Bytes (measured)

| fixture | animated | static | animated cap | static cap |
| --- | --- | --- | --- | --- |
| `fifteen-year-overflow` (worst case) | 75610 | 72478 | 75850 | 72900 |
| `mohasarc-captured` (sample) | 60875 | 57820 | 75850 | 72900 |

River's worst case sits under both existing ceilings, so no recalibration was needed.
