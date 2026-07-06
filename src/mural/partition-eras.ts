import type { Chapter } from '../chapters/chapter.js';
import type { HistorySnapshot } from '../history-snapshot.js';
import { addDays } from '../dates/add-days.js';
import { differenceInDays } from '../dates/difference-in-days.js';
import type { NarratedChapter } from '../timeline/build-timeline.js';
import { deriveTier } from './derive-tier.js';
import type { MuralEra } from './mural-scene.js';

/**
 * A contiguous era partition of [firstPublicActivityDate..capturedAtDate]. Each
 * chapter anchors an era; boundaries are the midpoints between adjacent anchor
 * dates, so point chapters get neighbor-bounded windows and every day lands under
 * exactly one era. A final present-day stretch runs to capturedAtDate. An account
 * with no public activity yet is one accountCreatedDate..capturedAtDate era.
 */
export function partitionEras(
  snapshot: HistorySnapshot,
  narratedChapters: NarratedChapter[],
): MuralEra[] {
  const { firstPublicActivityDate, accountCreatedDate, capturedAtDate } = snapshot;
  if (firstPublicActivityDate === null) {
    return [
      { chapter: null, startDate: accountCreatedDate, endDate: capturedAtDate, tier: 'modern' },
    ];
  }

  const spanStart = firstPublicActivityDate;
  const spanEnd = capturedAtDate;
  const anchoredChapters = narratedChapters
    .map(({ chapter }) => ({
      chapter,
      anchorDate: clampDate(chapterAnchorDate(chapter, spanStart), spanStart, spanEnd),
    }))
    .sort((a, b) => compareIsoDate(a.anchorDate, b.anchorDate));

  const eras: MuralEra[] = [];
  let startDate = spanStart;
  for (let index = 0; index < anchoredChapters.length; index++) {
    const nextAnchorDate =
      index + 1 < anchoredChapters.length ? anchoredChapters[index + 1].anchorDate : spanEnd;
    const endDate = midpointDate(anchoredChapters[index].anchorDate, nextAnchorDate);
    eras.push({
      chapter: anchoredChapters[index].chapter,
      startDate,
      endDate,
      tier: deriveTier(startDate, spanStart, spanEnd),
    });
    startDate = endDate;
  }
  eras.push({ chapter: null, startDate, endDate: spanEnd, tier: 'modern' });
  return eras;
}

function chapterAnchorDate(chapter: Chapter, fallbackDate: string): string {
  if (chapter.kind === 'origin') return chapter.date ?? fallbackDate;
  return chapter.date;
}

function midpointDate(earlierDate: string, laterDate: string): string {
  return addDays(earlierDate, Math.round(differenceInDays(earlierDate, laterDate) / 2));
}

function clampDate(date: string, lowDate: string, highDate: string): string {
  if (date < lowDate) return lowDate;
  if (date > highDate) return highDate;
  return date;
}

function compareIsoDate(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
