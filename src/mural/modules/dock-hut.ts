import type { ModuleFill } from '../mural-vocabulary.js';
import { outlinedPolygon, outlinedRect } from './outlined-shape.js';

/** A river dock hut (the ancient opener) in the normalized box (x 0..1, y 0..-heightScale), on y=0. */
export function dockHutModule(opts: { fill: ModuleFill; heightScale: number }): string {
  const { body, accent = opts.fill.body } = opts.fill;
  const top = -opts.heightScale;
  const wallTop = top * 0.62;
  return (
    outlinedRect(0.03, top * 0.32, 0.12, opts.heightScale * 0.32, accent) +
    outlinedRect(0.28, wallTop, 0.5, opts.heightScale * 0.62, body) +
    outlinedPolygon(
      [
        [0.18, wallTop],
        [0.88, wallTop],
        [0.53, top],
      ],
      accent,
    )
  );
}
