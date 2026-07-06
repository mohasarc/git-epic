import { describe, expect, it } from 'vitest';
import { addDays } from '../../dates/add-days.js';
import { detectChapters } from '../../chapters/detect-chapters.js';
import { narrateChapter } from '../../narration/narrate-chapter.js';
import { scoreStrengths } from '../../strengths/score-strengths.js';
import { buildHistorySnapshot } from '../../test-support/build-history-snapshot.js';
import { loadHistorySnapshotFixture } from '../../test-support/load-history-snapshot-fixture.js';
import { expectEmbedSafeSvg } from '../../test-support/expect-embed-safe-svg.js';
import { formatSvgNumber } from '../../rendering/format-svg-number.js';
import type { ContributionDay, HistorySnapshot } from '../../history-snapshot.js';
import type { NarratedChapter } from '../../timeline/build-timeline.js';
import { buildMuralScene } from '../build-mural-scene.js';
import type { MuralScene, RibbonColumn } from '../mural-scene.js';
import { MURAL_BYTE_CEILING, Y_BANDS } from '../mural-vocabulary.js';
import { desert } from '../worlds/desert.js';
import { renderMuralSvg } from '../render-mural-svg.js';
import {
  RIBBON_LEGEND_HIGH,
  RIBBON_LEGEND_LOW,
  renderRibbon,
  ribbonColumnColor,
} from './ribbon.js';

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function scene(snapshot: HistorySnapshot): MuralScene {
  return buildMuralScene(snapshot, narrate(snapshot), scoreStrengths(snapshot));
}

function run(startDate: string, length: number, count: number): ContributionDay[] {
  return Array.from({ length }, (_, index) => ({ date: addDays(startDate, index), count }));
}

const richScene = scene(loadHistorySnapshotFixture('rich-history-account.json'));
const fifteenYearScene = scene(loadHistorySnapshotFixture('fifteen-year-overflow.json'));

const boomScene = scene(
  buildHistorySnapshot({
    handle: 'boomtown',
    firstPublicActivityDate: '2024-01-01',
    contributionDays: run('2024-01-01', 150, 14),
  }),
);
const quietScene = scene(
  buildHistorySnapshot({
    handle: 'lone-lantern',
    firstPublicActivityDate: '2024-01-01',
    contributionDays: [
      { date: '2024-01-01', count: 1 },
      { date: '2024-06-15', count: 1 },
      { date: '2024-12-20', count: 1 },
    ],
  }),
);

function sceneColumns(built: MuralScene): RibbonColumn[] {
  return built.eras.flatMap((era) => era.ribbon);
}

type ColumnRect = { x: number; y: number; width: number; height: number; fill: string };

function columnRects(svg: string): ColumnRect[] {
  const pattern = /<rect x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)" fill="([^"]+)"\/>/g;
  return [...svg.matchAll(pattern)]
    .map((match) => ({
      x: Number(match[1]),
      y: Number(match[2]),
      width: Number(match[3]),
      height: Number(match[4]),
      fill: match[5],
    }))
    .filter((rect) => rect.y < Y_BANDS.ribbonBottom && rect.y >= Y_BANDS.roadBaseline - 0.01);
}

describe('renderRibbon column geometry', () => {
  it('emits one contiguous column per scene ribbon column', () => {
    const columns = sceneColumns(richScene);
    const rects = columnRects(renderRibbon(richScene.eras, richScene.width, desert));
    expect(rects).toHaveLength(columns.length);
    expect(rects[0].x).toBeCloseTo(columns[0].x, 2);
    const last = rects[rects.length - 1];
    expect(last.x + last.width).toBeCloseTo(columns[columns.length - 1].x + columns[columns.length - 1].width, 2);
    for (let index = 1; index < columns.length; index++) {
      expect(columns[index].x).toBeCloseTo(columns[index - 1].x + columns[index - 1].width, 6);
    }
  });

  it('positions columns at the scene ribbon x coordinates', () => {
    const columns = sceneColumns(richScene);
    const rects = columnRects(renderRibbon(richScene.eras, richScene.width, desert));
    for (let index = 0; index < columns.length; index++) {
      expect(rects[index].x).toBeCloseTo(columns[index].x, 2);
      expect(rects[index].width).toBeCloseTo(columns[index].width, 2);
    }
  });

  it('grows columns up from the ribbon bottom inside the ribbon band', () => {
    const rects = columnRects(renderRibbon(richScene.eras, richScene.width, desert));
    for (const rect of rects) {
      expect(rect.y + rect.height).toBeCloseTo(Y_BANDS.ribbonBottom, 2);
      expect(rect.y).toBeGreaterThanOrEqual(Y_BANDS.roadBaseline - 0.01);
    }
  });

  it('makes a boom era taller and more saturated than a quiet stretch', () => {
    const boom = columnRects(renderRibbon(boomScene.eras, boomScene.width, desert));
    const quiet = columnRects(renderRibbon(quietScene.eras, quietScene.width, desert));
    const tallest = (rects: ColumnRect[]) => Math.max(...rects.map((rect) => rect.height));
    expect(tallest(boom)).toBeGreaterThan(tallest(quiet));
    expect(boom.some((rect) => rect.fill === desert.ribbonRamp[desert.ribbonRamp.length - 1])).toBe(true);
    expect(quiet.every((rect) => rect.fill === desert.ribbonRamp[0])).toBe(true);
  });
});

describe('renderRibbon warm ramp and legend', () => {
  it('colors every column from the warm ramp, never green', () => {
    const svg = renderRibbon(richScene.eras, richScene.width, desert);
    const rects = columnRects(svg);
    const ramp = new Set<string>(desert.ribbonRamp);
    expect(rects.every((rect) => ramp.has(rect.fill))).toBe(true);
    for (const green of ['#216e39', '#30a14e', '#40c463', '#9be9a8', 'green']) {
      expect(svg).not.toContain(green);
    }
  });

  it('renders the less/more activity legend line', () => {
    const svg = renderRibbon(richScene.eras, richScene.width, desert);
    expect(svg).toContain(RIBBON_LEGEND_LOW);
    expect(svg).toContain(RIBBON_LEGEND_HIGH);
    expect(RIBBON_LEGEND_LOW).toBe('Less activity');
    expect(RIBBON_LEGEND_HIGH).toBe('More activity');
  });
});

describe('renderRibbon honest coverage', () => {
  it('derives every column color straight from the scene density, no faked columns', () => {
    const columns = sceneColumns(richScene);
    const rects = columnRects(renderRibbon(richScene.eras, richScene.width, desert));
    expect(rects).toHaveLength(columns.length);
    for (let index = 0; index < columns.length; index++) {
      expect(rects[index].fill).toBe(ribbonColumnColor(columns[index].density, desert));
      const expectedHeight = columns[index].density * (Y_BANDS.ribbonBottom - Y_BANDS.roadBaseline);
      expect(rects[index].height).toBeCloseTo(Number(formatSvgNumber(expectedHeight)), 2);
    }
  });
});

describe('renderRibbon in the full strip', () => {
  it('appears inside the mural and stays embed-safe', () => {
    const svg = renderMuralSvg(richScene);
    expect(columnRects(svg)).toHaveLength(sceneColumns(richScene).length);
    expectEmbedSafeSvg(svg);
  });

  it('keeps the densest fixtures under the byte ceiling', () => {
    const rich = Buffer.byteLength(renderMuralSvg(richScene), 'utf8');
    const fifteen = Buffer.byteLength(renderMuralSvg(fifteenYearScene), 'utf8');
    expect(rich).toBeLessThan(MURAL_BYTE_CEILING);
    expect(fifteen).toBeLessThan(MURAL_BYTE_CEILING);
  });
});
