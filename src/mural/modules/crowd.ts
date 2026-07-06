import type { ModuleFill } from '../mural-vocabulary.js';
import { outlinedCircle, outlinedPolygon } from './outlined-shape.js';

/** A single follower figure in the normalized box (x 0..1, y 0..-heightScale), standing on y=0. */
export function crowdModule(opts: { fill: ModuleFill; heightScale: number }): string {
  const { body, accent = opts.fill.body } = opts.fill;
  const top = -opts.heightScale;
  return (
    outlinedPolygon(
      [
        [0.3, 0],
        [0.7, 0],
        [0.62, top * 0.6],
        [0.38, top * 0.6],
      ],
      body,
    ) +
    outlinedCircle(0.5, top * 0.78, 0.16, accent)
  );
}
