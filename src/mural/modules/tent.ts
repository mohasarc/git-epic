import type { ModuleFill } from '../mural-vocabulary.js';
import { outlinedPolygon } from './outlined-shape.js';

/** A tent drawn in the normalized box (x 0..1, y 0..-heightScale), standing on y=0. */
export function tentModule(opts: { fill: ModuleFill; heightScale: number }): string {
  const { body, accent = opts.fill.body } = opts.fill;
  const apex = -opts.heightScale;
  return (
    outlinedPolygon(
      [
        [0, 0],
        [1, 0],
        [0.5, apex],
      ],
      body,
    ) +
    outlinedPolygon(
      [
        [0.5, 0],
        [1, 0],
        [0.5, apex],
      ],
      accent,
    )
  );
}
