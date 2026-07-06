# Stage 4 — the three worlds

Same history, three worlds. World is pure taste: it never encodes anything about the
user. The `mohasarc-captured` fixture renders below in each world — identical scene, only
palette and the two per-world signatures (ancient-opener camp, world prop) change.

## Input → output

```ts
import { renderMural } from 'git-epic';

renderMural(snapshot, 'desert'); // default
renderMural(snapshot, 'river');
renderMural(snapshot, 'mountain');
```

| world | material vocabulary | spine | signatures | sample |
| --- | --- | --- | --- | --- |
| desert | mudbrick → glass | road | tent camp, obelisk | [`mohasarc-captured.desert.svg`](./mohasarc-captured.desert.svg) |
| river | harbor → port | flowing water band | dock hut, boat | [`mohasarc-captured.river.svg`](./mohasarc-captured.river.svg) |
| mountain | stone → terraced | road, recolored | stone cairn, pine | [`mohasarc-captured.mountain.svg`](./mohasarc-captured.mountain.svg) |

River's spine is the one novel geometry: a continuous water band at the ribbon-top
baseline with a drifting current line looped forever. Desert and mountain draw a
polyline road. Classical/modern buildings stay the shared `structure` silhouette,
recolored per world — harbors and terraces are material flavor, not new shapes.

## Selection

`?world=desert|river|mountain` on the image endpoint picks one. Anything else — wrong
case, empty, unknown — hash-defaults off the handle (`WORLD_NAMES[hash(handle) % 3]`), so
every handle gets a stable world with no parameter. Determinism holds:
`identical (data, world) → identical bytes`.
