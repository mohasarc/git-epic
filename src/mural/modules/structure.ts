import type { ModuleFill } from '../mural-vocabulary.js';
import { outlinedPolygon, outlinedRect } from './outlined-shape.js';

/** A building drawn in the normalized box (x 0..1, y 0..-heightScale), standing on y=0. */
export function structureModule(opts: { fill: ModuleFill; heightScale: number }): string {
  const { body, accent = opts.fill.body } = opts.fill;
  const top = -opts.heightScale;
  const wallTop = top * 0.8;
  return (
    outlinedRect(0.2, wallTop, 0.6, opts.heightScale * 0.8, body) +
    outlinedPolygon(
      [
        [0.15, wallTop],
        [0.85, wallTop],
        [0.5, top],
      ],
      accent,
    ) +
    outlinedRect(0.42, top * 0.3, 0.16, opts.heightScale * 0.3, accent) +
    outlinedRect(0.3, top * 0.6, 0.12, opts.heightScale * 0.12, accent)
  );
}
