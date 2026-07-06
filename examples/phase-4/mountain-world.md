# Stage 4 · Phase 4 — mountain world

The mountain world overwrites its Phase-1 desert alias with a real bundle: cool grey-green
palette, stone→terraced materials, a stone-cairn ancient opener, a pine prop, and a recolored
road spine. Same scene data reads the same as in desert — only color and the two signatures
change.

## Input → output

```ts
import { renderMural } from 'git-epic';

renderMural(snapshot, 'mountain');
```

`mohasarc-captured` fixture in the mountain world → [`mohasarc-captured.mountain.svg`](./mohasarc-captured.mountain.svg).

## What mountain changes

- **Spine.** The desert road recolored — `spine.kind = 'road'`, same polyline geometry, no water
  band and no flow loop. Mountain carries none of river's new spine risk.
- **Signatures.** Camp module = stone cairn; prop module = pine. Classical/modern buildings stay
  the shared `structure` module, recolored — terraces are mountain's material flavor, not new shapes.
- **Palette.** Cool grey-green sky, stone-tier ground/structure fills, cool ribbon ramp, cool
  language accents. Title/plaque text stays shared dark (`#3a2417`) — reads clear on the light
  panel fill (`#d7e2dc`), so no per-world text color was needed.

## Bytes (measured)

| fixture | animated | static | animated cap | static cap |
| --- | --- | --- | --- | --- |
| `fifteen-year-overflow` (worst case) | 75419 | 72486 | 75850 | 72900 |
| `mohasarc-captured` (sample) | 60686 | 57830 | 75850 | 72900 |

Mountain's static render (72486) is the new cross-world static max — it edges past desert (72438)
and river (72478) but stays under the existing static ceiling, so the ceiling value holds and the
calibration comment in `mural-vocabulary.ts` now names mountain as the documented basis. The pine
prop stays a two-shape module, matching river's boat, so the three worlds share one byte budget with
no ceiling bump. Animated stays bound by river (75610).
