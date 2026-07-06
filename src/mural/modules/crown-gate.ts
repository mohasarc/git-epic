import type { ModuleFill } from '../mural-vocabulary.js';
import { outlinedPolygon } from './outlined-shape.js';

/** A star gateway crowned with points, in the normalized box (x 0..1, y 0..-heightScale), on y=0. */
export function crownGateModule(opts: { fill: ModuleFill; heightScale: number }): string {
  const { body, accent = opts.fill.body } = opts.fill;
  const top = -opts.heightScale;
  return (
    outlinedPolygon(
      [
        [0.15, 0],
        [0.15, top * 0.7],
        [0.5, top * 0.9],
        [0.85, top * 0.7],
        [0.85, 0],
      ],
      body,
    ) +
    outlinedPolygon(
      [
        [0.3, top * 0.9],
        [0.38, top],
        [0.46, top * 0.9],
        [0.54, top],
        [0.62, top * 0.9],
        [0.7, top],
        [0.78, top * 0.9],
      ],
      accent,
    )
  );
}
