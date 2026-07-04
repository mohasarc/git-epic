import type {
  AmbientScene,
  ChapterSceneSegment,
  PresentDayCardSegment,
  Timeline,
  TimelineSegment,
  TitleCardSegment,
} from '../timeline/timeline.js';
import { escapeXmlText } from './escape-xml-text.js';
import { formatSvgNumber } from './format-svg-number.js';
import { createSeededRandom } from './seeded-random.js';

const CANVAS_WIDTH = 830;
const CANVAS_HEIGHT = 415;
const CENTER_X = CANVAS_WIDTH / 2;
const SCENE_CENTER_Y = 186;

const BACKGROUND_COLOR = '#070b14';
const STAR_COLOR = '#dbe6ff';
const TEXT_COLOR = '#e8ecf5';
const DIM_TEXT_COLOR = '#8b93a7';
const SPARK_COLOR = '#ffd27d';
const FONT_STACK = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

const BACKDROP_STAR_COUNT = 110;
const TWINKLE_STAR_COUNT = 8;

export function renderEpicSvg(timeline: Timeline): string {
  const random = createSeededRandom(timeline.seed);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${formatSvgNumber(CANVAS_WIDTH)}" height="${formatSvgNumber(CANVAS_HEIGHT)}" viewBox="0 0 ${formatSvgNumber(CANVAS_WIDTH)} ${formatSvgNumber(CANVAS_HEIGHT)}" role="img">` +
    `<rect width="${formatSvgNumber(CANVAS_WIDTH)}" height="${formatSvgNumber(CANVAS_HEIGHT)}" fill="${BACKGROUND_COLOR}"/>` +
    renderBackdropStarfield(random) +
    timeline.segments.map(renderSegment).join('') +
    renderAmbientLayer(timeline.ambient, timeline.replayEndSeconds, random) +
    `</svg>`
  );
}

function renderBackdropStarfield(random: () => number): string {
  let stars = '';
  for (let starIndex = 0; starIndex < BACKDROP_STAR_COUNT; starIndex += 1) {
    const x = random() * CANVAS_WIDTH;
    const y = random() * CANVAS_HEIGHT;
    const radius = 0.4 + random() * 1.1;
    const opacity = 0.1 + random() * 0.45;
    stars += `<circle cx="${formatSvgNumber(x)}" cy="${formatSvgNumber(y)}" r="${formatSvgNumber(radius)}" fill="${STAR_COLOR}" opacity="${formatSvgNumber(opacity)}"/>`;
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
    centeredText(title, CENTER_X, 200, { fontSize: 36, fill: TEXT_COLOR, fontWeight: 'bold', letterSpacing: 5 }) +
    centeredText(`· est. ${segment.originYear} ·`, CENTER_X, 240, { fontSize: 17, fill: DIM_TEXT_COLOR, letterSpacing: 3 })
  );
}

function chapterSceneContent(segment: ChapterSceneSegment): string {
  return (
    chapterSceneVisual(segment) +
    centeredText(segment.narration, CENTER_X, 372, { fontSize: 17, fill: TEXT_COLOR })
  );
}

function chapterSceneVisual(segment: ChapterSceneSegment): string {
  switch (segment.chapter.kind) {
    case 'origin':
      return originSpark();
  }
}

function originSpark(): string {
  return (
    glowCircle(SCENE_CENTER_Y, 46, 0.08) +
    glowCircle(SCENE_CENTER_Y, 27, 0.2) +
    glowCircle(SCENE_CENTER_Y, 13, 0.55) +
    `<circle cx="${formatSvgNumber(CENTER_X)}" cy="${formatSvgNumber(SCENE_CENTER_Y)}" r="${formatSvgNumber(5)}" fill="${SPARK_COLOR}"/>`
  );
}

function glowCircle(centerY: number, radius: number, opacity: number): string {
  return `<circle cx="${formatSvgNumber(CENTER_X)}" cy="${formatSvgNumber(centerY)}" r="${formatSvgNumber(radius)}" fill="${SPARK_COLOR}" opacity="${formatSvgNumber(opacity)}"/>`;
}

function presentDayCardContent(segment: PresentDayCardSegment): string {
  return (
    centeredText('PRESENT DAY', CENTER_X, 200, { fontSize: 26, fill: TEXT_COLOR, fontWeight: 'bold', letterSpacing: 4 }) +
    centeredText(segment.capturedAtDate, CENTER_X, 234, { fontSize: 15, fill: DIM_TEXT_COLOR, letterSpacing: 2 })
  );
}

function renderAmbientLayer(
  ambient: AmbientScene,
  replayEndSeconds: number,
  random: () => number,
): string {
  const begin = `${formatSvgNumber(replayEndSeconds)}s`;
  const pulsingSpark =
    glowCircle(SCENE_CENTER_Y, 30, 0.16) +
    `<circle cx="${formatSvgNumber(CENTER_X)}" cy="${formatSvgNumber(SCENE_CENTER_Y)}" r="${formatSvgNumber(6)}" fill="${SPARK_COLOR}">` +
    `<animate attributeName="r" begin="${begin}" dur="7s" values="6;9;6" repeatCount="indefinite"/>` +
    `</circle>`;
  return (
    `<g opacity="0">` +
    pulsingSpark +
    renderTwinklingStars(begin, random) +
    centeredText(ambient.epicOfLine, CENTER_X, 342, { fontSize: 20, fill: TEXT_COLOR, letterSpacing: 1 }) +
    centeredText(ambient.creditLine, CENTER_X, 390, { fontSize: 13, fill: DIM_TEXT_COLOR }) +
    `<animate attributeName="opacity" begin="${begin}" dur="1.2s" values="0;1" fill="freeze"/>` +
    `</g>`
  );
}

function renderTwinklingStars(begin: string, random: () => number): string {
  let stars = '';
  for (let starIndex = 0; starIndex < TWINKLE_STAR_COUNT; starIndex += 1) {
    const x = random() * CANVAS_WIDTH;
    const y = random() * CANVAS_HEIGHT;
    const duration = 4 + random() * 4;
    stars +=
      `<circle cx="${formatSvgNumber(x)}" cy="${formatSvgNumber(y)}" r="${formatSvgNumber(1.4)}" fill="${STAR_COLOR}" opacity="0.2">` +
      `<animate attributeName="opacity" begin="${begin}" dur="${formatSvgNumber(duration)}s" values="0.2;0.8;0.2" repeatCount="indefinite"/>` +
      `</circle>`;
  }
  return stars;
}

type CenteredTextOptions = {
  fontSize: number;
  fill: string;
  fontWeight?: string;
  letterSpacing?: number;
};

function centeredText(content: string, x: number, y: number, options: CenteredTextOptions): string {
  const fontWeight = options.fontWeight ? ` font-weight="${options.fontWeight}"` : '';
  const letterSpacing =
    options.letterSpacing === undefined
      ? ''
      : ` letter-spacing="${formatSvgNumber(options.letterSpacing)}"`;
  return (
    `<text x="${formatSvgNumber(x)}" y="${formatSvgNumber(y)}" text-anchor="middle" font-family="${FONT_STACK}" font-size="${formatSvgNumber(options.fontSize)}" fill="${options.fill}"${fontWeight}${letterSpacing}>` +
    escapeXmlText(content) +
    `</text>`
  );
}
