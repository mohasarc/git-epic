import type { MuralScene, PlacedEra } from '../mural-scene.js';
import { Y_BANDS } from '../mural-vocabulary.js';
import { svgText } from './svg-text.js';

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
    renderSubtitle(scene) +
    scene.eras.map(eraTitleText).join('') +
    presentDayLabelText(scene)
  );
}

/** The handle-plus-fact caption, top-left. Window-relative once the strip stops panning. */
export function renderSubtitle(scene: MuralScene): string {
  return svgText(scene.subtitle, 24, SUBTITLE_Y, {
    fontSize: 13,
    anchor: 'start',
    letterSpacing: 0.5,
  });
}

export function eraTitleText(era: PlacedEra): string {
  return svgText(era.title, era.x + era.width / 2, ERA_TITLE_Y, {
    fontSize: 14,
    anchor: 'middle',
    fontWeight: 'bold',
    letterSpacing: 1.5,
  });
}

function presentDayLabelText(scene: MuralScene): string {
  const presentDay = scene.eras[scene.eras.length - 1];
  return svgText(scene.presentDayLabel, presentDay.x + presentDay.width / 2, PRESENT_DAY_LABEL_Y, {
    fontSize: 11,
    anchor: 'middle',
    letterSpacing: 1,
  });
}
