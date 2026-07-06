import { formatSvgNumber } from '../rendering/format-svg-number.js';
import type { ContributionDay } from '../history-snapshot.js';
import { buildExactRibbon } from './build-exact-ribbon.js';
import { renderAccessibility } from './layers/accessibility.js';
import { renderBadgeFinale } from './layers/badge-finale.js';
import { renderMotifs } from './layers/motifs.js';
import { renderLegend, ribbonColumnColor } from './layers/ribbon.js';
import { renderRoad } from './layers/road.js';
import { renderSky } from './layers/sky.js';
import { renderStructures } from './layers/structures.js';
import { renderDistantBand, renderEraGround } from './layers/terrain.js';
import { eraTitleText, renderSubtitle } from './layers/text.js';
import type { MuralScene, RibbonColumn } from './mural-scene.js';
import {
  FINALE_HEIGHT,
  FOOTER_HEIGHT,
  HEADER_HEIGHT,
  MARGIN,
  MURAL_HEIGHT,
  ROW_GAP,
  STATIC_ROW_WIDTH,
  Y_BANDS,
} from './mural-vocabulary.js';
import { packEraRows, rowY, type ExportRow } from './pack-era-rows.js';
import type { World } from './worlds/world.js';

/** Ribbon column height ramp; matches the compressed SVG ribbon's band (road baseline to ribbon bottom). */
const RIBBON_BAND_HEIGHT = Y_BANDS.ribbonBottom - Y_BANDS.roadBaseline;

/** The badge finale panel's fixed sky-band top; the export shifts it down to the finale band. */
const FINALE_PANEL_TOP = 84;

/**
 * The motion-free image export: the same world re-laid as full-width stacked rows, each a mural
 * slice with its own exact per-day ribbon on a true time axis, closing on the badge finale and one
 * shared footer legend. Rows pack in chapter order and never split an era. Document geometry is fixed
 * to STATIC_ROW_WIDTH (never scene.width), so bytes stay deterministic and the finale/legend anchor
 * to a stable content width. Assembled from the existing layer fragments — no layer is rewritten.
 */
export function renderStaticExport(
  scene: MuralScene,
  world: World,
  contributionDays: ContributionDay[],
): string {
  const rows = packEraRows(scene.eras, STATIC_ROW_WIDTH);
  const contentWidth = STATIC_ROW_WIDTH;
  const width = STATIC_ROW_WIDTH + 2 * MARGIN;
  const rowsBottom = HEADER_HEIGHT + rows.length * MURAL_HEIGHT + (rows.length - 1) * ROW_GAP;
  const finaleTop = rowsBottom;
  const height = rowsBottom + FINALE_HEIGHT + FOOTER_HEIGHT;

  const body =
    rows.map((row) => renderRow(scene, row, world, contributionDays)).join('') +
    `<g transform="translate(0,${formatSvgNumber(finaleTop - FINALE_PANEL_TOP)})">` +
    renderBadgeFinale(scene, world, { anchorWidth: contentWidth }) +
    `</g>` +
    `<g transform="translate(0,${formatSvgNumber(height - MURAL_HEIGHT)})">` +
    renderLegend(contentWidth, world) +
    `</g>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${formatSvgNumber(width)}" height="${formatSvgNumber(height)}" viewBox="0 0 ${formatSvgNumber(width)} ${formatSvgNumber(height)}" role="img">` +
    renderAccessibility(scene) +
    renderSubtitle(scene) +
    `<g transform="translate(${formatSvgNumber(MARGIN)},0)">` +
    body +
    `</g>` +
    `</svg>`
  );
}

/**
 * One packed row: a clip at [0, row.width] x MURAL_HEIGHT holding a full-width backdrop and the
 * era-absolute content shifted into the row frame by -startX. Draw order mirrors the strip renderer
 * (sky, distant band, ground, road, structures, motifs, ribbon, titles) so the road/water spine sits
 * over the ground; the clip contains seam overrun and edge structures.
 */
function renderRow(
  scene: MuralScene,
  row: ExportRow,
  world: World,
  contributionDays: ContributionDay[],
): string {
  const clipId = `export-row-${row.index}`;
  const shift = (inner: string): string =>
    `<g transform="translate(${formatSvgNumber(-row.startX)},0)">${inner}</g>`;
  return (
    `<clipPath id="${clipId}"><rect x="0" y="0" width="${formatSvgNumber(row.width)}" height="${formatSvgNumber(MURAL_HEIGHT)}"/></clipPath>` +
    `<g clip-path="url(#${clipId})" transform="translate(0,${formatSvgNumber(rowY(row.index))})">` +
    renderSky(row.width, world) +
    renderDistantBand(row.width, world) +
    shift(renderEraGround(row.startX, row.endX, row.eras, world)) +
    renderRoad(row.width, world) +
    shift(
      renderStructures(row.eras, scene.worldScale, world) +
        renderMotifs(row.eras, scene.worldScale, world) +
        renderExactRibbon(row, contributionDays, world) +
        row.eras.map(eraTitleText).join(''),
    ) +
    `</g>`
  );
}

/** The row's exact per-day ribbon as columns growing up from the ribbon bottom, colored by density. */
function renderExactRibbon(row: ExportRow, contributionDays: ContributionDay[], world: World): string {
  return buildExactRibbon(row, contributionDays).map((column) => renderColumn(column, world)).join('');
}

function renderColumn(column: RibbonColumn, world: World): string {
  const columnHeight = Number(formatSvgNumber(column.density * RIBBON_BAND_HEIGHT));
  const y = Y_BANDS.ribbonBottom - columnHeight;
  return `<rect x="${formatSvgNumber(column.x)}" y="${formatSvgNumber(y)}" width="${formatSvgNumber(column.width)}" height="${formatSvgNumber(columnHeight)}" fill="${ribbonColumnColor(column.density, world)}"/>`;
}
