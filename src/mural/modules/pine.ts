import type { ModuleFill } from '../mural-vocabulary.js';
import { outlinedPolygon, outlinedRect } from './outlined-shape.js';

/** A pine (mountain's world-flavor prop) in the normalized box (x 0..1, y 0..-heightScale), on y=0. */
export function pineModule(opts: { fill: ModuleFill; heightScale: number }): string {
  const { body, accent = opts.fill.body } = opts.fill;
  const h = opts.heightScale;
  return (
    outlinedRect(0.42, -h * 0.3, 0.16, h * 0.3, accent) +
    outlinedPolygon(
      [
        [0.12, -h * 0.28],
        [0.88, -h * 0.28],
        [0.5, -h],
      ],
      body,
    )
  );
}
