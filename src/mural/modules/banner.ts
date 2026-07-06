import type { ModuleFill } from '../mural-vocabulary.js';
import { outlinedRect } from './outlined-shape.js';

/** A hanging language banner in the normalized box (x 0..1, y 0..-heightScale), standing on y=0. */
export function bannerModule(opts: { fill: ModuleFill; heightScale: number }): string {
  const { body, accent = opts.fill.body } = opts.fill;
  const top = -opts.heightScale;
  return (
    outlinedRect(0.46, top, 0.08, opts.heightScale, body) +
    outlinedRect(0.3, top, 0.4, opts.heightScale * 0.55, accent)
  );
}
