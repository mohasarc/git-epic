# Phase 1 sample — byte-preserving composition refactors

Fixture: `rich-history-account.json` (9 eras, world scale metropolis).
No visual change: the static mural is byte-identical. This proves the four new seams compose back to the original bytes.

## Composition equalities (all true)

| Refactor | Equality | Holds |
| --- | --- | --- |
| terrain split | `renderTerrain === renderDistantBand + renderEraGround` | true |
| subtitle extract | `renderText.startsWith(renderSubtitle)` | true |
| structure accessor | `eras.map(renderEraStructures).join('') === renderStructures` | true |
| motif accessor | `eras.map(renderEraMotifs).join('') === renderMotifs` | true |
| finale anchor | `renderBadgeFinale(scene) === renderBadgeFinale(scene, { anchorWidth: scene.width })` | true |

## New per-plane / per-era fragments

```
renderDistantBand(1957):
<rect x="0" y="150" width="1957" height="60" fill="#d98b4a"/>

renderSubtitle(scene):
<text x="24" y="28" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#3a2417" text-anchor="start" letter-spacing="0.5">saga-weaver · JavaScript artisan</text>

renderEraStructures(era @ x=24):
<g transform="translate(30,300) scale(20.07,128)"><rect x="0.2" y="-0.8" width="0.6" height="0.8" fill="#a86a3a" stroke="#3a2417" stroke-width="1" vector-effect="non-scaling-stroke"/><polygon points="0.15,-0.8 0.85,-0.8  …

renderEraMotifs(era @ x=208):
<g transform="translate(214,300) scale(136.5,97.68)"><rect x="0.45" y="-0.55" width="0.1" height="0.55" fill="#c8763c" stroke="#3a2417" stroke-width="1" vector-effect="non-scaling-stroke"/><rect x="0.15" y="-1" width="0. …

renderBadgeFinale(scene, { anchorWidth: 640 }) left/width shifts to the camera window:
<rect x="68.7" y="84" width="555.3" height="34" rx="6" fill="#fbe3bd" stroke="#3a2417" stroke-width="1"/><text x="346.35" y="105.2" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#3a2417" text-anchor="middle" letter-spacing="0.5">JavaScript Specialist · Heavy PR Contributor · Followed · Star Magnet</text>
```
