import type { ModuleFill } from '../mural-vocabulary.js';
import { outlinedPolygon, outlinedRect } from './outlined-shape.js';

/** An obelisk marker in the normalized box (x 0..1, y 0..-heightScale), standing on y=0. */
export function markerModule(opts: { fill: ModuleFill; heightScale: number }): string {
  const { body, accent = opts.fill.body } = opts.fill;
  const top = -opts.heightScale;
  const shaftTop = top * 0.85;
  return (
    outlinedRect(0.4, shaftTop, 0.2, opts.heightScale * 0.85, body) +
    outlinedPolygon(
      [
        [0.4, shaftTop],
        [0.6, shaftTop],
        [0.5, top],
      ],
      accent,
    )
  );
}
