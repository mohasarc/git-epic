import type { ModuleFill } from '../mural-vocabulary.js';
import { outlinedPolygon } from './outlined-shape.js';

/** A moored boat (river's world-flavor prop) in the normalized box (x 0..1, y 0..-heightScale), on y=0. */
export function boatModule(opts: { fill: ModuleFill; heightScale: number }): string {
  const { body, accent = opts.fill.body } = opts.fill;
  const deck = -opts.heightScale * 0.35;
  return (
    outlinedPolygon(
      [
        [0.1, deck],
        [0.9, deck],
        [0.72, 0],
        [0.28, 0],
      ],
      body,
    ) +
    outlinedPolygon(
      [
        [0.5, deck],
        [0.5, -opts.heightScale],
        [0.82, -opts.heightScale * 0.45],
      ],
      accent,
    )
  );
}
