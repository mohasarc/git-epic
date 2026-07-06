import type { ModuleFill } from '../mural-vocabulary.js';
import { outlinedRect } from './outlined-shape.js';

/** A PR bridge: deck on two piers, in the normalized box (x 0..1, y 0..-heightScale), on y=0. */
export function bridgeModule(opts: { fill: ModuleFill; heightScale: number }): string {
  const { body, accent = opts.fill.body } = opts.fill;
  const deckTop = -opts.heightScale * 0.5;
  const pierHeight = opts.heightScale * 0.5;
  return (
    outlinedRect(0.1, deckTop, 0.12, pierHeight, body) +
    outlinedRect(0.78, deckTop, 0.12, pierHeight, body) +
    outlinedRect(0, deckTop, 1, opts.heightScale * 0.16, accent)
  );
}
