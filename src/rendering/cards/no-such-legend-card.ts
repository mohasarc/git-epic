import { deriveSeedFromHandle } from '../../timeline/derive-seed-from-handle.js';
import { renderCard } from './card-frame.js';

export function renderNoSuchLegendCard(requestedHandle: string): string {
  return renderCard({
    seed: deriveSeedFromHandle(requestedHandle),
    primaryLine: 'No such legend',
    secondaryLine: `The archives bear no epic of ${requestedHandle}.`,
  });
}
