import { differenceInDays } from '../dates/difference-in-days.js';
import type { MuralTier } from './mural-scene.js';

/** Which third of [spanStartDate..spanEndDate] the date falls in. */
export function deriveTier(date: string, spanStartDate: string, spanEndDate: string): MuralTier {
  const spanDays = differenceInDays(spanStartDate, spanEndDate);
  if (spanDays <= 0) return 'modern';

  const fraction = differenceInDays(spanStartDate, date) / spanDays;
  if (fraction < 1 / 3) return 'ancient';
  if (fraction < 2 / 3) return 'classical';
  return 'modern';
}
