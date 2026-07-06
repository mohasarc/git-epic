import type { ModuleFill } from '../mural-vocabulary.js';
import { outlinedCircle, outlinedPolygon } from './outlined-shape.js';

/** A ground prop (rock/mound) in the normalized box (x 0..1, y 0..-heightScale), on y=0. */
export function propModule(opts: { fill: ModuleFill; heightScale: number }): string {
  const { body, accent } = opts.fill;
  const mound = outlinedPolygon(
    [
      [0.1, 0],
      [0.35, -opts.heightScale * 0.5],
      [0.6, -opts.heightScale * 0.6],
      [0.9, -opts.heightScale * 0.3],
      [1, 0],
    ],
    body,
  );
  if (accent === undefined) {
    return mound;
  }
  return mound + outlinedCircle(0.7, -opts.heightScale * 0.15, 0.08, accent);
}
