import type { ModuleFill } from '../mural-vocabulary.js';
import { outlinedRect } from './outlined-shape.js';

/** An issues notice board on a post, in the normalized box (x 0..1, y 0..-heightScale), on y=0. */
export function noticeBoardModule(opts: { fill: ModuleFill; heightScale: number }): string {
  const { body, accent = opts.fill.body } = opts.fill;
  const top = -opts.heightScale;
  return (
    outlinedRect(0.45, top * 0.55, 0.1, opts.heightScale * 0.55, body) +
    outlinedRect(0.15, top, 0.7, opts.heightScale * 0.45, accent)
  );
}
