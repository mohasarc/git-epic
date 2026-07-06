import type { ContributionDay, HistorySnapshot } from '../history-snapshot.js';
import type { StrengthsResult } from '../strengths/score-strengths.js';
import type { NarratedChapter } from '../timeline/build-timeline.js';
import { allocateSlots } from './allocate-slots.js';
import { deriveBadges } from './derive-badges.js';
import { deriveWorldScale } from './derive-world-scale.js';
import { layOutEras } from './era-widths.js';
import { placeMotifs } from './place-motifs.js';
import type { MuralEra, MuralScene, PlacedEra } from './mural-scene.js';
import { MURAL_HEIGHT } from './mural-vocabulary.js';
import {
  PRESENT_DAY_LABEL,
  accessibleDescription,
  accessibleTitle,
  eraTitle,
  stripSubtitle,
} from './mural-text.js';
import { partitionEras } from './partition-eras.js';
import { bucketRibbon } from './ribbon-buckets.js';

/**
 * The complete pure mural model: contiguous eras with allocated slots, honest
 * ribbon columns, terse text, grace-floored. Deterministic — no seed, no clock, no
 * SVG. Seed-driven cosmetic choices are deferred to the render layer.
 */
export function buildMuralScene(
  snapshot: HistorySnapshot,
  narratedChapters: NarratedChapter[],
  strengths: StrengthsResult,
): MuralScene {
  const eras = partitionEras(snapshot, narratedChapters);
  const worldScale = deriveWorldScale(strengths);
  const { placements, width } = layOutEras(eras, worldScale);

  const placedEras: PlacedEra[] = eras.map((era, index) => {
    const placement = placements[index];
    const eraDays = eraContributionDays(snapshot.contributionDays, era, index === eras.length - 1);
    const eraCount = eraDays.reduce((total, day) => total + day.count, 0);
    return {
      ...era,
      x: placement.x,
      width: placement.width,
      slots: allocateSlots(placement, worldScale, eraCount),
      ribbon: bucketRibbon(era, placement, eraDays),
      title: eraTitle(era.chapter),
      motifs: [],
    };
  });

  return {
    handle: snapshot.handle,
    width,
    height: MURAL_HEIGHT,
    worldScale,
    eras: placeMotifs(placedEras, strengths),
    badges: deriveBadges(strengths),
    subtitle: stripSubtitle(snapshot, strengths),
    presentDayLabel: PRESENT_DAY_LABEL,
    accessibleTitle: accessibleTitle(snapshot.handle),
    accessibleDescription: accessibleDescription(narratedChapters),
  };
}

/** Days under this era; the final era owns its closing boundary so no day is dropped. */
function eraContributionDays(
  days: ContributionDay[],
  era: MuralEra,
  isLastEra: boolean,
): ContributionDay[] {
  return days.filter(
    (day) => day.date >= era.startDate && (isLastEra ? day.date <= era.endDate : day.date < era.endDate),
  );
}
