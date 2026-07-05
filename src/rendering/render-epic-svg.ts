import type {
  AmbientScene,
  ChapterSceneSegment,
  PresentDayCardSegment,
  Timeline,
  TimelineSegment,
  TitleCardSegment,
} from '../timeline/timeline.js';
import { formatSvgNumber } from './format-svg-number.js';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CENTER_X,
  SCENE_CENTER_Y,
  centeredText,
  fadingRule,
  ornamentDot,
  sparkGlow,
} from './scene-primitives.js';
import { darkAgeScene } from './scenes/dark-age-scene.js';
import { flagshipRiseScene } from './scenes/flagship-rise-scene.js';
import { greatStreakScene } from './scenes/great-streak-scene.js';
import { languageEraScene } from './scenes/language-era-scene.js';
import { originScene } from './scenes/origin-scene.js';
import { prolificacyScene } from './scenes/prolificacy-scene.js';
import { starMilestoneScene } from './scenes/star-milestone-scene.js';
import { createSeededRandom } from './seeded-random.js';
import { renderBackdropStarfield, renderTwinklingStars } from './starfield.js';
import { renderUniverseGradients } from './svg-gradients.js';
import { PALETTE, STYLE_MOTION, TYPOGRAPHY } from './visual-vocabulary.js';

const ORBIT_RADIUS_STEP = 13;
const ORBIT_PERIOD_STEP_SECONDS = 4;
const ORBIT_START_ANGLE_STEP_DEGREES = 72;

export function renderEpicSvg(timeline: Timeline): string {
  const random = createSeededRandom(timeline.seed);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${formatSvgNumber(CANVAS_WIDTH)}" height="${formatSvgNumber(CANVAS_HEIGHT)}" viewBox="0 0 ${formatSvgNumber(CANVAS_WIDTH)} ${formatSvgNumber(CANVAS_HEIGHT)}" role="img">` +
    renderUniverseGradients() +
    `<rect width="${formatSvgNumber(CANVAS_WIDTH)}" height="${formatSvgNumber(CANVAS_HEIGHT)}" fill="${PALETTE.background}"/>` +
    renderBackdropStarfield(random) +
    timeline.segments.map(renderSegment).join('') +
    renderAmbientLayer(timeline.ambient, timeline.replayEndSeconds, random) +
    `</svg>`
  );
}

function renderSegment(segment: TimelineSegment): string {
  return `<g opacity="0">${segmentContent(segment)}${segmentRevealAnimation(segment)}</g>`;
}

function segmentContent(segment: TimelineSegment): string {
  switch (segment.kind) {
    case 'title-card':
      return titleCardContent(segment);
    case 'chapter-scene':
      return chapterSceneContent(segment);
    case 'present-day-card':
      return presentDayCardContent(segment);
  }
}

function segmentRevealAnimation(segment: TimelineSegment): string {
  return `<animate attributeName="opacity" begin="${formatSvgNumber(segment.startSeconds)}s" dur="${formatSvgNumber(segment.durationSeconds)}s" values="0;1;1;0" keyTimes="0;0.12;0.88;1" fill="freeze"/>`;
}

function titleCardContent(segment: TitleCardSegment): string {
  const title = `THE EPIC OF ${segment.handle.toUpperCase()}`;
  return (
    sparkGlow(CENTER_X, 150, 26) +
    `<circle cx="${formatSvgNumber(CENTER_X)}" cy="150" r="3.2" fill="${PALETTE.spark}"/>` +
    centeredText(title, CENTER_X, 212, {
      fontSize: 38,
      fill: 'url(#gilded)',
      fontWeight: 'bold',
      letterSpacing: TYPOGRAPHY.titleLetterSpacing,
    }) +
    fadingRule(CENTER_X - 130, 232, 260) +
    centeredText(`· est. ${segment.originYear} ·`, CENTER_X, 258, {
      fontSize: 16,
      fill: PALETTE.dimText,
      letterSpacing: 4,
    })
  );
}

function chapterSceneContent(segment: ChapterSceneSegment): string {
  return (
    `<ellipse cx="${formatSvgNumber(CENTER_X)}" cy="${formatSvgNumber(SCENE_CENTER_Y)}" rx="330" ry="150" fill="url(#nebula)"/>` +
    chapterSceneVisual(segment) +
    composedCaption(segment.narration)
  );
}

function composedCaption(narration: string): string {
  return (
    fadingRule(30, 352, 55) +
    fadingRule(CANVAS_WIDTH - 85, 352, 55) +
    ornamentDot(95, 352.5) +
    ornamentDot(CANVAS_WIDTH - 95, 352.5) +
    centeredText(narration, CENTER_X, 357, {
      fontSize: 15.5,
      fill: 'url(#gilded)',
      fontStyle: 'italic',
      letterSpacing: 0.5,
    })
  );
}

function chapterSceneVisual(segment: ChapterSceneSegment): string {
  switch (segment.chapter.kind) {
    case 'origin':
      return originScene(segment);
    case 'dark-age':
      return darkAgeScene(segment);
    case 'great-streak':
      return greatStreakScene(segment);
    case 'prolificacy':
      return prolificacyScene(segment);
    case 'flagship-rise':
      return flagshipRiseScene(segment);
    case 'star-milestone':
      return starMilestoneScene(segment);
    case 'language-era':
      return languageEraScene(segment);
  }
}

function presentDayCardContent(segment: PresentDayCardSegment): string {
  return (
    centeredText('PRESENT DAY', CENTER_X, 200, {
      fontSize: 26,
      fill: 'url(#gilded)',
      fontWeight: 'bold',
      letterSpacing: 4,
    }) +
    fadingRule(CENTER_X - 100, 220, 200) +
    centeredText(segment.capturedAtDate, CENTER_X, 246, {
      fontSize: 15,
      fill: PALETTE.dimText,
      letterSpacing: 2,
    })
  );
}

function renderAmbientLayer(
  ambient: AmbientScene,
  replayEndSeconds: number,
  random: () => number,
): string {
  const begin = `${formatSvgNumber(replayEndSeconds)}s`;
  return (
    `<g opacity="0">` +
    `<ellipse cx="${formatSvgNumber(CENTER_X)}" cy="${formatSvgNumber(SCENE_CENTER_Y)}" rx="300" ry="135" fill="url(#nebula)" opacity="0.7"/>` +
    dashedHalo(begin) +
    pulsingCore(begin) +
    orbitingBodies(begin, ambient.orbitingBodyCount) +
    renderTwinklingStars(begin, ambient.twinkleStarCount, random) +
    centeredText(ambient.epicOfLine, CENTER_X, 345, {
      fontSize: 20,
      fill: 'url(#gilded)',
      letterSpacing: 1.5,
    }) +
    centeredText(ambient.creditLine, CENTER_X, 391, { fontSize: 13, fill: PALETTE.dimText }) +
    `<animate attributeName="opacity" begin="${begin}" dur="1.2s" values="0;1" fill="freeze"/>` +
    `</g>`
  );
}

function dashedHalo(begin: string): string {
  return (
    `<circle cx="${formatSvgNumber(CENTER_X)}" cy="${formatSvgNumber(SCENE_CENTER_Y)}" r="88" fill="none" stroke="${PALETTE.orbitIndigo}" stroke-width="0.5" opacity="0.14" stroke-dasharray="2 7">` +
    `<animateTransform attributeName="transform" type="rotate" begin="${begin}" dur="${formatSvgNumber(STYLE_MOTION.haloRotationSeconds)}s" from="0 ${formatSvgNumber(CENTER_X)} ${formatSvgNumber(SCENE_CENTER_Y)}" to="360 ${formatSvgNumber(CENTER_X)} ${formatSvgNumber(SCENE_CENTER_Y)}" repeatCount="indefinite"/>` +
    `</circle>`
  );
}

function pulsingCore(begin: string): string {
  return (
    sparkGlow(CENTER_X, SCENE_CENTER_Y, 30) +
    `<circle cx="${formatSvgNumber(CENTER_X)}" cy="${formatSvgNumber(SCENE_CENTER_Y)}" r="6" fill="${PALETTE.spark}">` +
    `<animate attributeName="r" begin="${begin}" dur="${formatSvgNumber(STYLE_MOTION.corePulseSeconds)}s" values="6;9;6" repeatCount="indefinite"/>` +
    `</circle>`
  );
}

function orbitingBodies(begin: string, bodyCount: number): string {
  let bodies = '';
  for (let bodyIndex = 0; bodyIndex < bodyCount; bodyIndex += 1) {
    bodies += orbitingBody(begin, bodyIndex);
  }
  return bodies;
}

function orbitingBody(begin: string, bodyIndex: number): string {
  const orbitRadius = 88 - ORBIT_RADIUS_STEP * bodyIndex;
  const periodSeconds = STYLE_MOTION.ambientDriftSeconds + ORBIT_PERIOD_STEP_SECONDS * bodyIndex;
  const startAngle = ORBIT_START_ANGLE_STEP_DEGREES * bodyIndex;
  const accent = bodyIndex % 2 === 0 ? PALETTE.orbitBlue : PALETTE.orbitIndigo;
  return (
    `<g>` +
    `<circle cx="${formatSvgNumber(CENTER_X + orbitRadius)}" cy="${formatSvgNumber(SCENE_CENTER_Y)}" r="2.2" fill="${accent}"/>` +
    `<animateTransform attributeName="transform" type="rotate" begin="${begin}" dur="${formatSvgNumber(periodSeconds)}s" from="${formatSvgNumber(startAngle)} ${formatSvgNumber(CENTER_X)} ${formatSvgNumber(SCENE_CENTER_Y)}" to="${formatSvgNumber(startAngle + 360)} ${formatSvgNumber(CENTER_X)} ${formatSvgNumber(SCENE_CENTER_Y)}" repeatCount="indefinite"/>` +
    `</g>`
  );
}

