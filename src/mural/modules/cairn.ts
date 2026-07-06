import type { ModuleFill } from '../mural-vocabulary.js';
import { outlinedCircle, outlinedPolygon } from './outlined-shape.js';

/** A stacked stone cairn (mountain's ancient opener) in the normalized box (x 0..1, y 0..-heightScale), on y=0. */
export function cairnModule(opts: { fill: ModuleFill; heightScale: number }): string {
  const { body, accent = opts.fill.body } = opts.fill;
  const h = opts.heightScale;
  return (
    outlinedPolygon(
      [
        [0.08, 0],
        [0.92, 0],
        [0.74, -h * 0.4],
        [0.26, -h * 0.4],
      ],
      body,
    ) +
    outlinedPolygon(
      [
        [0.26, -h * 0.4],
        [0.74, -h * 0.4],
        [0.62, -h * 0.74],
        [0.38, -h * 0.74],
      ],
      accent,
    ) +
    outlinedCircle(0.5, -h * 0.87, 0.13, body)
  );
}
