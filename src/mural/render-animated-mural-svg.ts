import { formatSvgNumber } from '../rendering/format-svg-number.js';
import type { CameraTrack } from './camera-track.js';
import { BEAT_SETTLE_SECONDS, PLANE_RATE } from './camera-track.js';
import { buildCameraTrack } from './build-camera.js';
import { renderAccessibility } from './layers/accessibility.js';
import { renderBadgeFinale } from './layers/badge-finale.js';
import { renderMotif } from './layers/motifs.js';
import { renderRibbon } from './layers/ribbon.js';
import { renderRoad } from './layers/road.js';
import { renderSky } from './layers/sky.js';
import { renderEraStructures } from './layers/structures.js';
import { renderDistantBand, renderEraGround } from './layers/terrain.js';
import { eraTitleText, renderSubtitle } from './layers/text.js';
import type { MuralMotif, MuralScene, PlacedEra, WorldScale } from './mural-scene.js';
import { CAMERA_WINDOW_WIDTH, MURAL_HEIGHT } from './mural-vocabulary.js';
import { desert } from './worlds/desert.js';

/** Rise-and-fade of a dwelled era's content once the camera settles on it. */
const BEAT_SECONDS = 0.5;
const BEAT_RISE_OFFSET = 8;

/** The perpetual living rest state: at most this many looped motifs in the trailing window. */
const AMBIENT_ELEMENT_CAP = 8;
const SWAY_SECONDS = 3;
const SWAY_DEGREES = 2;
const GLOW_SECONDS = 2.5;
const BOB_SECONDS = 2;
const BOB_OFFSET = 2;

/**
 * The baked animated desert: three parallax planes framed by the camera window and panned by
 * the dwell-and-zip track. BACK is the window-pinned sky; MID is the distant band at a slower
 * rate; FRONT carries every road-coupled layer at full rate, dwelled eras fading in on a beat.
 * Motifs in the trailing rest window loop forever. Sub-window strips degrade to a static
 * centered hold with no pan and no ambient.
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
  const finale = renderBadgeFinale(scene, desert, { anchorWidth: CAMERA_WINDOW_WIDTH });
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
  return `<g class="mural-plane back">${renderSky(CAMERA_WINDOW_WIDTH, desert)}</g>`;
}

/** Distant band, extended on the trailing edge so the slower plane still covers the window. */
function midPlane(scene: MuralScene, track: CameraTrack, isSubWindow: boolean): string {
  const bleed = (1 - PLANE_RATE.distantBand) * maxPanSpan(scene.width);
  const band = renderDistantBand(scene.width + bleed, desert);
  if (isSubWindow) return staticPlane('mid', scene.width, band);
  return `<g class="mural-plane mid">${band}${panAnimateTransform(track, PLANE_RATE.distantBand)}</g>`;
}

/** Every layer spatially coupled to the road, panned at full rate. */
function frontPlane(scene: MuralScene, track: CameraTrack, isSubWindow: boolean): string {
  const ambient = isSubWindow ? new Set<MuralMotif>() : selectAmbientMotifs(scene);
  const eraGroups = scene.eras
    .map((era, index) => renderEraGroup(scene, era, track.eraTimings[index], !isSubWindow, ambient))
    .join('');
  const body =
    renderEraGround(scene.width, scene.eras, desert) +
    renderRoad(scene.width, desert) +
    renderRibbon(scene.eras, scene.width, desert) +
    eraGroups;
  if (isSubWindow) return staticPlane('front', scene.width, body);
  return `<g class="mural-plane front">${body}${panAnimateTransform(track, PLANE_RATE.front)}</g>`;
}

/**
 * One era's road-coupled content — structures, motifs, title. Dwelled eras rise and fade in as
 * the camera settles (translateY + opacity beats, nested under the front pan); zipped eras and
 * the sub-window hold sit present at full opacity. Rest-window motifs keep an indefinite loop.
 */
function renderEraGroup(
  scene: MuralScene,
  era: PlacedEra,
  timing: CameraTrack['eraTimings'][number],
  animateBeats: boolean,
  ambient: Set<MuralMotif>,
): string {
  const body =
    renderEraStructures(era, scene.worldScale, desert) +
    renderEraMotifsWithAmbient(era, scene.worldScale, ambient) +
    eraTitleText(era);
  if (!animateBeats || !timing.dwelled) return `<g class="mural-era">${body}</g>`;
  return (
    `<g class="mural-era" opacity="0" transform="translate(0,${formatSvgNumber(BEAT_RISE_OFFSET)})">` +
    body +
    introBeats(timing.dwellStartSeconds) +
    `</g>`
  );
}

/** Motifs, with the rest-window ones wrapped in their own loop group so the beat stays on the era. */
function renderEraMotifsWithAmbient(
  era: PlacedEra,
  worldScale: WorldScale,
  ambient: Set<MuralMotif>,
): string {
  return era.motifs
    .map((motif) => {
      const drawn = renderMotif(motif, worldScale, desert);
      if (!ambient.has(motif)) return drawn;
      return `<g class="mural-ambient">${drawn}${ambientLoop(motif)}</g>`;
    })
    .join('');
}

/**
 * The motifs that live forever after the freeze: those seated in the trailing rest window
 * `[sceneWidth − W, sceneWidth]` whose kind maps to a loop, capped so the file stays bounded.
 */
function selectAmbientMotifs(scene: MuralScene): Set<MuralMotif> {
  const restWindowStart = scene.width - CAMERA_WINDOW_WIDTH;
  const selected = new Set<MuralMotif>();
  for (const era of scene.eras) {
    for (const motif of era.motifs) {
      const center = motif.x + motif.width / 2;
      if (center < restWindowStart) continue;
      if (ambientMotion(motif) === null) continue;
      if (selected.size >= AMBIENT_ELEMENT_CAP) return selected;
      selected.add(motif);
    }
  }
  return selected;
}

type AmbientMotion = 'sway' | 'glow' | 'bob';

/** Desert's living gestures: banners sway, gold glows, crowds bob; the rest hold still. */
function ambientMotion(motif: MuralMotif): AmbientMotion | null {
  if (motif.kind === 'banner') return 'sway';
  if (motif.standout || motif.kind === 'crownGate') return 'glow';
  if (motif.kind === 'crowd') return 'bob';
  return null;
}

function ambientLoop(motif: MuralMotif): string {
  const motion = ambientMotion(motif);
  if (motion === 'sway') return swayLoop(motif);
  if (motion === 'glow') return glowLoop();
  return bobLoop();
}

/** A banner rocking a couple of degrees about its base. */
function swayLoop(motif: MuralMotif): string {
  const pivotX = formatSvgNumber(motif.x + motif.width / 2);
  const pivotY = formatSvgNumber(motif.baselineY);
  const rest = `${formatSvgNumber(-SWAY_DEGREES)} ${pivotX} ${pivotY}`;
  const tilt = `${formatSvgNumber(SWAY_DEGREES)} ${pivotX} ${pivotY}`;
  return (
    `<animateTransform attributeName="transform" type="rotate" ` +
    `values="${rest};${tilt};${rest}" dur="${formatSvgNumber(SWAY_SECONDS)}s" repeatCount="indefinite"/>`
  );
}

/** A gold accent breathing between dim and bright. */
function glowLoop(): string {
  return (
    `<animate attributeName="opacity" values="0.85;1;0.85" ` +
    `dur="${formatSvgNumber(GLOW_SECONDS)}s" repeatCount="indefinite"/>`
  );
}

/** A crowd bobbing a pixel or two. */
function bobLoop(): string {
  return (
    `<animateTransform attributeName="transform" type="translate" ` +
    `values="0 0;0 ${formatSvgNumber(BOB_OFFSET)};0 0" dur="${formatSvgNumber(BOB_SECONDS)}s" repeatCount="indefinite"/>`
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
