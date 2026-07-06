# Phase 6 — entry point, scene-build parity, service wiring

The static export is now reachable end to end. Both mural surfaces build the scene
through one shared path (`buildSceneFromSnapshot`), so story and badges match by
construction.

## Input → output

A GitHub handle request:

```
GET /saga-weaver.svg?preview=mural-static            → desert  (hash-default world)
GET /saga-weaver.svg?preview=mural-static&world=river → river
GET /saga-weaver.svg?preview=mural-static&world=mountain → mountain
```

renders the row-wrapped static export for `test-fixtures/rich-history-account.json`
(handle `saga-weaver`):

- [`rich-history-account-desert.svg`](rich-history-account-desert.svg) — 42553 bytes
- [`rich-history-account-river.svg`](rich-history-account-river.svg) — 42518 bytes
- [`rich-history-account-mountain.svg`](rich-history-account-mountain.svg) — 42589 bytes

No motion (no `<animate*>`, no `dur=`). Deterministic: same `(snapshot, world)` → same bytes.

## Surface map

| `?preview=` | variant | renderer | cache key |
|---|---|---|---|
| absent / other | `cosmic` | `renderEpic` | `<handle>` |
| `mural` | `mural` | `renderMural` | `<handle>:mural:<world>` |
| `mural-static` | `static` | `renderMuralExport` | `<handle>:static:<world>` |

`mural` and `static` keep distinct per-world cache entries; neither serves the other's
body. Cosmic and mural paths and keys are unchanged.
