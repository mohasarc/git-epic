import { formatSvgNumber } from '../rendering/format-svg-number.js';
import type { CameraTrack } from './camera-track.js';
import { BEAT_SETTLE_SECONDS, PLANE_RATE } from './camera-track.js';
import { buildCameraTrack } from './build-camera.js';
import { renderAccessibility } from './layers/accessibility.js';
import { renderBadgeFinale } from './layers/badge-finale.js';
import { renderEraMotifs } from './layers/motifs.js';
import { renderRibbon } from './layers/ribbon.js';
import { renderRoad } from './layers/road.js';
import { renderSky } from './layers/sky.js';
import { renderEraStructures } from './layers/structures.js';
import { renderDistantBand, renderEraGround } from './layers/terrain.js';
import { eraTitleText, renderSubtitle } from './layers/text.js';
import type { MuralScene, PlacedEra } from './mural-scene.js';
import { CAMERA_WINDOW_WIDTH, MURAL_HEIGHT } from './mural-vocabulary.js';

/** Rise-and-fade of a dwelled era's content once the camera settles on it. */
const BEAT_SECONDS = 0.5;
const BEAT_RISE_OFFSET = 8;

/**
 * The baked animated desert: three parallax planes framed by the camera window and panned by
 * the dwell-and-zip track. BACK is the window-pinned sky; MID is the distant band at a slower
 * rate; FRONT carries every road-coupled layer at full rate. Sub-window strips degrade to a
 * static centered hold with no pan. Beats, HUD, and ambient loops arrive in later phases.
 */
export function renderAnimatedMuralSvg(scene: MuralScene): string {
  const track = buildCameraTrack(scene.eras, scene.width);
  const isSubWindow = scene.width <= CAMERA_WINDOW_WIDTH;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${formatSvgNumber(CAMERA_WINDOW_WIDTH)}" height="${formatSvgNumber(MURAL_HEIGHT)}" viewBox="0 0 ${formatSvgNumber(CAMERA_WINDOW_WIDTH)} ${formatSvgNumber(MURAL_HEIGHT)}" role="img">` +
    renderAccessibility(scene) +
    backPlane() +
    midPlane(scene, track, isSubWindow) +
    frontPlane(scene, track, isSubWindow) +
    hudPlane(scene, track) +
    `</svg>`
  );
}

/**
 * Topmost window-pinned overlay, rate 0 (never translated): the persistent subtitle caption and
 * the badge finale. The finale anchors to the camera window so the freeze frame never clips, and
 * fades in exactly as the camera settles on the present-day dwell — the money shot.
 */
function hudPlane(scene: MuralScene, track: CameraTrack): string {
  const presentDay = track.eraTimings[track.eraTimings.length - 1];
  const begin = `${formatSvgNumber(presentDay.dwellStartSeconds + BEAT_SETTLE_SECONDS)}s`;
  const finale = renderBadgeFinale(scene, { anchorWidth: CAMERA_WINDOW_WIDTH });
  return `<g class="mural-hud">${renderSubtitle(scene)}${finaleFade(finale, begin)}</g>`;
}

/** The finale panel, hidden until the present-day dwell settles, then frozen in. */
function finaleFade(finale: string, begin: string): string {
  if (finale === '') return '';
  return (
    `<g class="mural-finale" opacity="0">` +
    finale +
    `<animate attributeName="opacity" from="0" to="1" dur="${formatSvgNumber(BEAT_SECONDS)}s" begin="${begin}" fill="freeze"/>` +
    `</g>`
  );
}

/** Window-pinned sky gradient, rate 0 — never translated. */
function backPlane(): string {
  return `<g class="mural-plane back">${renderSky(CAMERA_WINDOW_WIDTH)}</g>`;
}

/** Distant band, extended on the trailing edge so the slower plane still covers the window. */
function midPlane(scene: MuralScene, track: CameraTrack, isSubWindow: boolean): string {
  const bleed = (1 - PLANE_RATE.distantBand) * maxPanSpan(scene.width);
  const band = renderDistantBand(scene.width + bleed);
  if (isSubWindow) return staticPlane('mid', scene.width, band);
  return `<g class="mural-plane mid">${band}${panAnimateTransform(track, PLANE_RATE.distantBand)}</g>`;
}

/** Every layer spatially coupled to the road, panned at full rate. */
function frontPlane(scene: MuralScene, track: CameraTrack, isSubWindow: boolean): string {
  const eraGroups = scene.eras
    .map((era, index) => renderEraGroup(scene, era, track.eraTimings[index], !isSubWindow))
    .join('');
  const body =
    renderEraGround(scene.width, scene.eras) +
    renderRoad(scene.width) +
    renderRibbon(scene.eras, scene.width) +
    eraGroups;
  if (isSubWindow) return staticPlane('front', scene.width, body);
  return `<g class="mural-plane front">${body}${panAnimateTransform(track, PLANE_RATE.front)}</g>`;
}

/**
 * One era's road-coupled content — structures, motifs, title. Dwelled eras rise and fade in as
 * the camera settles (translateY + opacity beats, nested under the front pan); zipped eras and
 * the sub-window hold sit present at full opacity.
 */
function renderEraGroup(
  scene: MuralScene,
  era: PlacedEra,
  timing: CameraTrack['eraTimings'][number],
  animateBeats: boolean,
): string {
  const body =
    renderEraStructures(era, scene.worldScale) +
    renderEraMotifs(era, scene.worldScale) +
    eraTitleText(era);
  if (!animateBeats || !timing.dwelled) return `<g class="mural-era">${body}</g>`;
  return (
    `<g class="mural-era" opacity="0" transform="translate(0,${formatSvgNumber(BEAT_RISE_OFFSET)})">` +
    body +
    introBeats(timing.dwellStartSeconds) +
    `</g>`
  );
}

/** Opacity fade plus a short upward slide, both firing once the camera has settled on the dwell. */
function introBeats(dwellStartSeconds: number): string {
  const begin = `${formatSvgNumber(dwellStartSeconds + BEAT_SETTLE_SECONDS)}s`;
  const dur = `${formatSvgNumber(BEAT_SECONDS)}s`;
  return (
    `<animate attributeName="opacity" from="0" to="1" dur="${dur}" begin="${begin}" fill="freeze"/>` +
    `<animateTransform attributeName="transform" type="translate" from="0 ${formatSvgNumber(BEAT_RISE_OFFSET)}" to="0 0" dur="${dur}" begin="${begin}" fill="freeze"/>`
  );
}

function staticPlane(plane: 'mid' | 'front', sceneWidth: number, body: string): string {
  const centered = formatSvgNumber((CAMERA_WINDOW_WIDTH - sceneWidth) / 2);
  return `<g class="mural-plane ${plane}" transform="translate(${centered},0)">${body}</g>`;
}

function panAnimateTransform(track: CameraTrack, rate: number): string {
  const values = track.track.values.map((value) => `${formatSvgNumber(value * rate)} 0`).join(';');
  const keyTimes = track.track.keyTimes.map((keyTime) => formatSvgNumber(keyTime)).join(';');
  const keySplines = track.track.keySplines.join(';');
  return (
    `<animateTransform attributeName="transform" type="translate" ` +
    `dur="${formatSvgNumber(track.track.totalSeconds)}s" calcMode="spline" ` +
    `keyTimes="${keyTimes}" keySplines="${keySplines}" values="${values}" fill="freeze"/>`
  );
}

function maxPanSpan(sceneWidth: number): number {
  return Math.max(0, sceneWidth - CAMERA_WINDOW_WIDTH);
}
