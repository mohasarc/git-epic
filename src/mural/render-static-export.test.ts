import { describe, expect, it } from 'vitest';
import { detectChapters } from '../chapters/detect-chapters.js';
import { narrateChapter } from '../narration/narrate-chapter.js';
import { scoreStrengths } from '../strengths/score-strengths.js';
import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { expectEmbedSafeSvg } from '../test-support/expect-embed-safe-svg.js';
import { formatSvgNumber } from '../rendering/format-svg-number.js';
import type { HistorySnapshot } from '../history-snapshot.js';
import type { NarratedChapter } from '../timeline/build-timeline.js';
import { buildMuralScene } from './build-mural-scene.js';
import type { MuralScene } from './mural-scene.js';
import {
  FINALE_HEIGHT,
  FOOTER_HEIGHT,
  HEADER_HEIGHT,
  MARGIN,
  MURAL_HEIGHT,
  ROW_GAP,
  STATIC_ROW_WIDTH,
} from './mural-vocabulary.js';
import { packEraRows, rowY } from './pack-era-rows.js';
import { renderStaticExport } from './render-static-export.js';
import { desert } from './worlds/desert.js';

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function scene(snapshot: HistorySnapshot): MuralScene {
  return buildMuralScene(snapshot, narrate(snapshot), scoreStrengths(snapshot));
}

const richSnapshot = loadHistorySnapshotFixture('rich-history-account.json');
const richScene = scene(richSnapshot);
const richRows = packEraRows(richScene.eras, STATIC_ROW_WIDTH);

const brandNewSnapshot = buildHistorySnapshot({
  handle: 'unwritten-legend',
  firstPublicActivityDate: null,
  accountCreatedDate: '2026-06-30',
  capturedAtDate: '2026-07-04',
});
const brandNewScene = scene(brandNewSnapshot);

const contentWidth = STATIC_ROW_WIDTH;
const exportWidth = STATIC_ROW_WIDTH + 2 * MARGIN;

function render(): string {
  return renderStaticExport(richScene, desert, richSnapshot.contributionDays);
}

describe('renderStaticExport document frame', () => {
  it('emits one svg fitted to the computed export width and height', () => {
    const svg = render();
    expect(svg.match(/<svg\b/g)).toHaveLength(1);
    const rowsBottom =
      HEADER_HEIGHT + richRows.length * MURAL_HEIGHT + (richRows.length - 1) * ROW_GAP;
    const height = rowsBottom + FINALE_HEIGHT + FOOTER_HEIGHT;
    expect(svg).toContain(
      `viewBox="0 0 ${formatSvgNumber(exportWidth)} ${formatSvgNumber(height)}"`,
    );
    expect(svg).toContain(`width="${formatSvgNumber(exportWidth)}"`);
    expect(svg).toContain(`height="${formatSvgNumber(height)}"`);
    expect(svg).toContain('role="img"');
  });

  it('carries exactly one accessible title and desc', () => {
    const svg = render();
    expect(svg.match(/<title>/g)).toHaveLength(1);
    expect(svg.match(/<desc>/g)).toHaveLength(1);
  });

  it('draws one subtitle header line from the scene subtitle', () => {
    const svg = render();
    const subtitleMatches = [...svg.matchAll(/>([^<]*)<\/text>/g)].filter(
      (match) => match[1] === richScene.subtitle,
    );
    expect(subtitleMatches).toHaveLength(1);
  });

  it('draws exactly one footer legend', () => {
    const svg = render();
    expect(svg.match(/Less activity/g)).toHaveLength(1);
    expect(svg.match(/More activity/g)).toHaveLength(1);
  });
});

describe('renderStaticExport rows', () => {
  it('wraps the multi-row rich fixture into more than one row', () => {
    expect(richRows.length).toBeGreaterThan(1);
  });

  it('places each row at rowY(index), spaced MURAL_HEIGHT + ROW_GAP apart', () => {
    const svg = render();
    for (const row of richRows) {
      expect(svg).toContain(`transform="translate(0,${formatSvgNumber(rowY(row.index))})"`);
    }
    expect(rowY(1) - rowY(0)).toBe(MURAL_HEIGHT + ROW_GAP);
  });

  it('clips each row at [0, row.width] x MURAL_HEIGHT', () => {
    const svg = render();
    for (const row of richRows) {
      expect(svg).toContain(`<clipPath id="export-row-${row.index}">`);
      expect(svg).toContain(
        `<rect x="0" y="0" width="${formatSvgNumber(row.width)}" height="${formatSvgNumber(MURAL_HEIGHT)}"/>`,
      );
      expect(svg).toContain(`clip-path="url(#export-row-${row.index})"`);
    }
  });

  it('shifts row content by -startX but not the backdrop', () => {
    const svg = render();
    const secondRow = richRows.find((row) => row.startX > 0);
    expect(secondRow).toBeDefined();
    if (!secondRow) return;
    // Backdrop (sky/road/band) draws full-width with no -startX shift.
    const backdropShift = `translate(0,${formatSvgNumber(rowY(secondRow.index))})`;
    expect(svg).toContain(backdropShift);
    // Content is era-absolute, shifted into the row frame.
    expect(svg).toContain(`translate(${formatSvgNumber(-secondRow.startX)},0)`);
  });
});

describe('renderStaticExport finale and legend anchoring', () => {
  it('places the badge finale below the last row anchored to the content width', () => {
    const svg = render();
    const rowsBottom =
      HEADER_HEIGHT + richRows.length * MURAL_HEIGHT + (richRows.length - 1) * ROW_GAP;
    // Finale panel is wrapped so its fixed sky-band top (84) lands at the finale band top.
    expect(svg).toContain(`transform="translate(0,${formatSvgNumber(rowsBottom - 84)})"`);
    // Anchored to content width, not scene.width, so its right edge stays inside the export.
    expect(contentWidth).toBeLessThan(richScene.width);
    for (const badge of richScene.badges) {
      expect(svg).toContain(badge.label);
    }
  });
});

describe('renderStaticExport embed safety', () => {
  it('is embed-safe for a rich multi-row export', () => {
    expectEmbedSafeSvg(render());
  });

  it('is embed-safe and single-row for a brand-new account', () => {
    const rows = packEraRows(brandNewScene.eras, STATIC_ROW_WIDTH);
    expect(rows).toHaveLength(1);
    const svg = renderStaticExport(brandNewScene, desert, brandNewSnapshot.contributionDays);
    expectEmbedSafeSvg(svg);
    expect(svg.match(/<clipPath\b/g)).toHaveLength(1);
  });

  it('emits no SMIL motion', () => {
    const svg = render();
    expect(svg).not.toContain('<animate');
    expect(svg).not.toContain('dur=');
  });
});
