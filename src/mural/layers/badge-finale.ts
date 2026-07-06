import { formatSvgNumber } from '../../rendering/format-svg-number.js';
import type { Badge, MuralScene } from '../mural-scene.js';
import { MURAL_OUTLINE, MURAL_OUTLINE_WIDTH } from '../mural-vocabulary.js';
import type { World } from '../worlds/world.js';
import { svgText } from './svg-text.js';

const FONT_SIZE = 12;
const MIN_FONT_SIZE = 7;
const LETTER_SPACING = 0.5;
const CHAR_ADVANCE = 0.6;
const PADDING_X = 12;
const PANEL_HEIGHT = 34;
const PANEL_TOP = 84;
const SIDE_MARGIN = 16;
const CORNER_RADIUS = 6;
const SEPARATOR = ' · ';

/**
 * The climax panel: a content-sized warm plaque at the present-day right region of the
 * sky band, listing the earned badges as one middle-dot-separated line. Rendered topmost
 * so it settles over the finished world. Sized to its text and right-anchored; on a mural
 * too narrow for the full line the font shrinks (down to MIN_FONT_SIZE) so the panel stays
 * inside the canvas rather than overflowing the left edge.
 * Derived badges are always non-empty; the empty guard only covers the pre-wiring scene.
 */
export function renderBadgeFinale(
  scene: MuralScene,
  world: World,
  { anchorWidth = scene.width }: { anchorWidth?: number } = {},
): string {
  if (scene.badges.length === 0) return '';
  const line = scene.badges.map(badgeText).join(SEPARATOR);
  const maxPanelWidth = anchorWidth - SIDE_MARGIN * 2;
  const fontSize = fitFontSize(line, maxPanelWidth);
  const panelWidth = Math.min(panelWidthAt(line, fontSize), maxPanelWidth);
  const left = Math.max(SIDE_MARGIN, anchorWidth - SIDE_MARGIN - panelWidth);
  const centerX = left + panelWidth / 2;
  const baselineY = PANEL_TOP + PANEL_HEIGHT / 2 + fontSize * 0.35;
  return (
    panelRect(left, panelWidth, world.panelFill) +
    svgText(line, centerX, baselineY, { fontSize, anchor: 'middle', letterSpacing: LETTER_SPACING })
  );
}

function panelWidthAt(line: string, fontSize: number): number {
  return line.length * (fontSize * CHAR_ADVANCE + LETTER_SPACING) + PADDING_X * 2;
}

function fitFontSize(line: string, maxPanelWidth: number): number {
  if (panelWidthAt(line, FONT_SIZE) <= maxPanelWidth) return FONT_SIZE;
  const usableTextWidth = maxPanelWidth - PADDING_X * 2 - line.length * LETTER_SPACING;
  const scaled = usableTextWidth / (line.length * CHAR_ADVANCE);
  return Math.max(MIN_FONT_SIZE, scaled);
}

function badgeText(badge: Badge): string {
  return badge.plaque ? `${badge.label} ${badge.plaque}` : badge.label;
}

function panelRect(left: number, width: number, fill: string): string {
  return (
    `<rect x="${formatSvgNumber(left)}" y="${formatSvgNumber(PANEL_TOP)}"` +
    ` width="${formatSvgNumber(width)}" height="${formatSvgNumber(PANEL_HEIGHT)}" rx="${formatSvgNumber(CORNER_RADIUS)}"` +
    ` fill="${fill}" stroke="${MURAL_OUTLINE}" stroke-width="${formatSvgNumber(MURAL_OUTLINE_WIDTH)}"/>`
  );
}
