# Phase 2 — world selection

`resolveWorldName(param, handle)` picks the world; the mural cache is keyed by the resolved
name. Explicit `?world=` values match only when lowercase-exact against `['desert','river','mountain']`;
everything else (wrong case, empty, absent, unknown) hash-defaults off the normalized handle
(`WORLD_NAMES[deriveSeedFromHandle(handle) % 3]`). River/mountain still alias desert this phase,
so bytes are unchanged — only the plumbing and cache keys differ.

| request | handle | resolved world | mural cache key |
| --- | --- | --- | --- |
| `?preview=mural` | octocat | desert | `octocat:mural:desert` |
| `?preview=mural&world=river` | octocat | river | `octocat:mural:river` |
| `?preview=mural&world=mountain` | octocat | mountain | `octocat:mural:mountain` |
| `?preview=mural&world=River` | octocat | desert (wrong case → hash default) | `octocat:mural:desert` |
| `?preview=mural&world=ocean` | octocat | desert (unknown → hash default) | `octocat:mural:desert` |
| `?preview=mural` | mohasarc | river (hash default) | `mohasarc:mural:river` |
| `?preview=mural` | torvalds | mountain (hash default) | `torvalds:mural:mountain` |
