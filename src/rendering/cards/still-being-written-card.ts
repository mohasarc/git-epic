import { renderCard } from './card-frame.js';

const STILL_BEING_WRITTEN_SEED = 987654321;

export function renderStillBeingWrittenCard(): string {
  return renderCard({
    seed: STILL_BEING_WRITTEN_SEED,
    primaryLine: 'The epic is still being written',
    secondaryLine: 'Return shortly to witness it unfold.',
  });
}
