import { escapeXmlText } from '../../rendering/escape-xml-text.js';
import { formatSvgNumber } from '../../rendering/format-svg-number.js';
import type { MuralScene, PlacedEra } from '../mural-scene.js';
import { MURAL_OUTLINE, MURAL_TYPOGRAPHY, Y_BANDS } from '../mural-vocabulary.js';

const SUBTITLE_Y = 28;
const ERA_TITLE_Y = 52;
const PRESENT_DAY_LABEL_Y = Y_BANDS.roadBaseline - 10;

/**
 * The visible strip text: the handle-plus-fact subtitle top-left, an all-caps title
 * centered above each era, and the present-day label anchored at the road under the
 * present-day stretch. Every string is escaped — the strings themselves come straight
 * from the scene (§6.7), so text can never gate a render.
 */
export function renderText(scene: MuralScene): string {
  return (
    subtitleText(scene.subtitle) +
    scene.eras.map(eraTitleText).join('') +
    presentDayLabelText(scene)
  );
}

function subtitleText(subtitle: string): string {
  return textElement(subtitle, 24, SUBTITLE_Y, {
    fontSize: 13,
    anchor: 'start',
    letterSpacing: 0.5,
  });
}

function eraTitleText(era: PlacedEra): string {
  return textElement(era.title, era.x + era.width / 2, ERA_TITLE_Y, {
    fontSize: 14,
    anchor: 'middle',
    fontWeight: 'bold',
    letterSpacing: 1.5,
  });
}

function presentDayLabelText(scene: MuralScene): string {
  const presentDay = scene.eras[scene.eras.length - 1];
  return textElement(scene.presentDayLabel, presentDay.x + presentDay.width / 2, PRESENT_DAY_LABEL_Y, {
    fontSize: 11,
    anchor: 'middle',
    letterSpacing: 1,
  });
}

type TextOptions = {
  fontSize: number;
  anchor: 'start' | 'middle';
  fontWeight?: 'bold';
  letterSpacing: number;
};

function textElement(content: string, x: number, y: number, options: TextOptions): string {
  const fontWeight = options.fontWeight ? ` font-weight="${options.fontWeight}"` : '';
  return (
    `<text x="${formatSvgNumber(x)}" y="${formatSvgNumber(y)}" font-family="${MURAL_TYPOGRAPHY.fontStack}" font-size="${formatSvgNumber(options.fontSize)}" fill="${MURAL_OUTLINE}" text-anchor="${options.anchor}" letter-spacing="${formatSvgNumber(options.letterSpacing)}"${fontWeight}>` +
    escapeXmlText(content) +
    `</text>`
  );
}
