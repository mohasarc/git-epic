# Phase 7 sample — rest-window ambient loops

After the pan freezes, the visitor rests on the trailing camera window `[sceneWidth − W, sceneWidth]`.
Motifs seated in that window keep an indefinite loop so the scene stays alive: banners sway, gold
glows, crowds bob. The loop lives on an inner `<g class="mural-ambient">` wrapper around the single
motif, never on the era beat group — the beat settles the era once, the loop runs forever. Capped at
8 elements so the file stays bounded. Ambient lives in the animated path only; `renderMuralSvg`
stays motion-free.

## Rich metropolis

Input: `rich-history-account.json` → 9 eras, `scene.width = 1957`, rest window starts at
`1957 − 640 = 1317`. One motif falls in it: the language-era boulevard banner (center `1409.25`).
Animated render is 73250 bytes.

### The banner sway (real output)

```
<g class="mural-ambient">
  <g transform="translate(1341,164) scale(68.25,74)">…banner atom…</g>
  <g transform="translate(1409.25,164) scale(68.25,74)">…banner atom…</g>
  <animateTransform attributeName="transform" type="rotate"
    values="-2 1409.25 164;2 1409.25 164;-2 1409.25 164" dur="3s" repeatCount="indefinite"/>
</g>
```

- Rotate pivots about the motif base center (`x + width/2`, `baselineY`) so the banner rocks in
  place, ±2°, 3s period.
- The banner here is zipped-through, not dwelled — ambient is keyed on the rest window, independent
  of the dwell selection.

## The three gestures

| Kind | Motion | Element | Values | Period |
| --- | --- | --- | --- | --- |
| `banner` | sway | `<animateTransform type="rotate">` | `-2 cx cy;2 cx cy;-2 cx cy` | 3s |
| `crownGate` / `standout` | glow | `<animate attributeName="opacity">` | `0.85;1;0.85` | 2.5s |
| `crowd` | bob | `<animateTransform type="translate">` | `0 0;0 2;0 0` | 2s |

Glow loop (gold accents):

```
<animate attributeName="opacity" values="0.85;1;0.85" dur="2.5s" repeatCount="indefinite"/>
```

Bob loop (crowd):

```
<animateTransform attributeName="transform" type="translate" values="0 0;0 2;0 0" dur="2s" repeatCount="indefinite"/>
```

## Guarantees

- Only motifs whose center sits in `[sceneWidth − W, sceneWidth]` loop; off-window motifs stay
  still.
- Loop rides the inner `mural-ambient` wrapper; the era `<g>` keeps its one-shot intro beat.
- At most 8 ambient elements; extra in-window motifs render without a loop.
- Rest window with no loopable motif → no ambient, no crash.
- Sub-window grace floor gets no ambient (static centered hold).
- `renderMuralSvg` for the same scene has no `<animate>`; embed-safe; byte-identical re-render.
