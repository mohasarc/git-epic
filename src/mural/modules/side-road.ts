import type { ModuleFill } from '../mural-vocabulary.js';
import { outlinedPolygon } from './outlined-shape.js';

/** A forked side road receding upward, in the normalized box (x 0..1, y 0..-heightScale), on y=0. */
export function sideRoadModule(opts: { fill: ModuleFill; heightScale: number }): string {
  const { body } = opts.fill;
  const top = -opts.heightScale;
  return outlinedPolygon(
    [
      [0, 0],
      [0.55, 0],
      [1, top],
      [0.5, top],
    ],
    body,
  );
}
