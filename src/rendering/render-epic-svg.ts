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
import { flagshipRiseScene } from './scenes/flagship-rise-scene.js';
import { originScene } from './scenes/origin-scene.js';
import { prolificacyScene } from './scenes/prolificacy-scene.js';
import { starMilestoneScene } from './scenes/star-milestone-scene.js';
import { createSeededRandom } from './seeded-random.js';
import { PALETTE, STYLE_MOTION, TYPOGRAPHY } from './visual-vocabulary.js';

const BACKDROP_STAR_COUNT = 110;
const TWINKLE_STAR_COUNT = 8;

export function renderEpicSvg(timeline: Timeline): string {
  const random = createSeededRandom(timeline.seed);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${formatSvgNumber(CANVAS_WIDTH)}" height="${formatSvgNumber(CANVAS_HEIGHT)}" viewBox="0 0 ${formatSvgNumber(CANVAS_WIDTH)} ${formatSvgNumber(CANVAS_HEIGHT)}" role="img">` +
    renderGradientDefinitions() +
    `<rect width="${formatSvgNumber(CANVAS_WIDTH)}" height="${formatSvgNumber(CANVAS_HEIGHT)}" fill="${PALETTE.background}"/>` +
    renderBackdropStarfield(random) +
    timeline.segments.map(renderSegment).join('') +
    renderAmbientLayer(timeline.ambient, timeline.replayEndSeconds, random) +
    `</svg>`
  );
}

function renderGradientDefinitions(): string {
  return (
    `<defs>` +
    `<radialGradient id="nebula" cx="50%" cy="45%" r="65%">` +
    `<stop offset="0%" stop-color="${PALETTE.nebulaCore}" stop-opacity="0.85"/>` +
    `<stop offset="45%" stop-color="${PALETTE.nebulaEdge}" stop-opacity="0.45"/>` +
    `<stop offset="100%" stop-color="${PALETTE.background}" stop-opacity="0"/>` +
    `</radialGradient>` +
    `<radialGradient id="spark-glow" cx="50%" cy="50%" r="50%">` +
    `<stop offset="0%" stop-color="${PALETTE.spark}" stop-opacity="0.9"/>` +
    `<stop offset="40%" stop-color="${PALETTE.sparkWarm}" stop-opacity="0.35"/>` +
    `<stop offset="100%" stop-color="${PALETTE.sparkWarm}" stop-opacity="0"/>` +
    `</radialGradient>` +
    `<linearGradient id="gilded" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="${PALETTE.gildedLight}"/>` +
    `<stop offset="100%" stop-color="${PALETTE.gildedDeep}"/>` +
    `</linearGradient>` +
    `<linearGradient id="rule-fade" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0%" stop-color="${PALETTE.gildedDeep}" stop-opacity="0"/>` +
    `<stop offset="50%" stop-color="${PALETTE.gildedDeep}" stop-opacity="0.8"/>` +
    `<stop offset="100%" stop-color="${PALETTE.gildedDeep}" stop-opacity="0"/>` +
    `</linearGradient>` +
    `</defs>`
  );
}

function renderBackdropStarfield(random: () => number): string {
  let stars = '';
  for (let starIndex = 0; starIndex < BACKDROP_STAR_COUNT; starIndex += 1) {
    const x = random() * CANVAS_WIDTH;
    const y = random() * CANVAS_HEIGHT;
    const radius = 0.4 + random() * 1.1;
    const opacity = 0.1 + random() * 0.45;
    stars += `<circle cx="${formatSvgNumber(x)}" cy="${formatSvgNumber(y)}" r="${formatSvgNumber(radius)}" fill="${PALETTE.starlight}" opacity="${formatSvgNumber(opacity)}"/>`;
  }
  return `<g>${stars}</g>`;
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
      return placeholderSceneVisual();
    case 'great-streak':
      return placeholderSceneVisual();
    case 'prolificacy':
      return prolificacyScene(segment);
    case 'flagship-rise':
      return flagshipRiseScene(segment);
    case 'star-milestone':
      return starMilestoneScene(segment);
    case 'language-era':
      return placeholderSceneVisual();
  }
}

/** Stand-in glow until each chapter kind gets its own scene. */
function placeholderSceneVisual(): string {
  return (
    sparkGlow(CENTER_X, SCENE_CENTER_Y, 40) +
    `<circle cx="${formatSvgNumber(CENTER_X)}" cy="${formatSvgNumber(SCENE_CENTER_Y)}" r="4" fill="${PALETTE.spark}" opacity="0.6"/>`
  );
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
    orbitingBody(begin) +
    renderTwinklingStars(begin, random) +
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

function orbitingBody(begin: string): string {
  return (
    `<g>` +
    `<circle cx="${formatSvgNumber(CENTER_X + 88)}" cy="${formatSvgNumber(SCENE_CENTER_Y)}" r="2.2" fill="${PALETTE.orbitBlue}"/>` +
    `<animateTransform attributeName="transform" type="rotate" begin="${begin}" dur="${formatSvgNumber(STYLE_MOTION.ambientDriftSeconds)}s" from="0 ${formatSvgNumber(CENTER_X)} ${formatSvgNumber(SCENE_CENTER_Y)}" to="360 ${formatSvgNumber(CENTER_X)} ${formatSvgNumber(SCENE_CENTER_Y)}" repeatCount="indefinite"/>` +
    `</g>`
  );
}

function renderTwinklingStars(begin: string, random: () => number): string {
  let stars = '';
  for (let starIndex = 0; starIndex < TWINKLE_STAR_COUNT; starIndex += 1) {
    const x = random() * CANVAS_WIDTH;
    const y = random() * CANVAS_HEIGHT;
    const duration = STYLE_MOTION.twinklePeriodSeconds + random() * 4;
    stars +=
      `<circle cx="${formatSvgNumber(x)}" cy="${formatSvgNumber(y)}" r="${formatSvgNumber(1.4)}" fill="${PALETTE.starlight}" opacity="0.2">` +
      `<animate attributeName="opacity" begin="${begin}" dur="${formatSvgNumber(duration)}s" values="0.2;0.8;0.2" repeatCount="indefinite"/>` +
      `</circle>`;
  }
  return stars;
}
