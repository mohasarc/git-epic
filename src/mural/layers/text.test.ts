import { describe, expect, it } from 'vitest';
import { detectChapters } from '../../chapters/detect-chapters.js';
import { narrateChapter } from '../../narration/narrate-chapter.js';
import { scoreStrengths } from '../../strengths/score-strengths.js';
import { buildHistorySnapshot } from '../../test-support/build-history-snapshot.js';
import { loadHistorySnapshotFixture } from '../../test-support/load-history-snapshot-fixture.js';
import { expectEmbedSafeSvg } from '../../test-support/expect-embed-safe-svg.js';
import { escapeXmlText } from '../../rendering/escape-xml-text.js';
import type { HistorySnapshot } from '../../history-snapshot.js';
import type { NarratedChapter } from '../../timeline/build-timeline.js';
import { buildMuralScene } from '../build-mural-scene.js';
import type { MuralScene } from '../mural-scene.js';
import { renderMuralSvg } from '../render-mural-svg.js';
import { renderText } from './text.js';

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function scene(snapshot: HistorySnapshot): MuralScene {
  return buildMuralScene(snapshot, narrate(snapshot), scoreStrengths(snapshot));
}

const richScene = scene(loadHistorySnapshotFixture('rich-history-account.json'));

const brandNewScene = scene(
  buildHistorySnapshot({
    handle: 'unwritten-legend',
    firstPublicActivityDate: null,
    accountCreatedDate: '2026-06-30',
    capturedAtDate: '2026-07-04',
  }),
);

function textContents(svg: string): string[] {
  return [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((match) => match[1]);
}

describe('renderText visible strings', () => {
  it('renders every era title as visible text', () => {
    const contents = textContents(renderText(richScene));
    for (const era of richScene.eras) {
      expect(contents).toContain(escapeXmlText(era.title));
    }
  });

  it('renders the strip subtitle', () => {
    const contents = textContents(renderText(richScene));
    expect(contents).toContain(escapeXmlText(richScene.subtitle));
  });

  it('renders the present-day label', () => {
    const contents = textContents(renderText(richScene));
    expect(contents).toContain(escapeXmlText(richScene.presentDayLabel));
  });
});

describe('renderText escaping and safety', () => {
  it('escapes every visible string', () => {
    const hostile = scene(buildHistorySnapshot({ handle: '<b>&"weird' }));
    const svg = renderText(hostile);
    expect(svg).not.toContain('<b>&');
    expect(svg).toContain(escapeXmlText(hostile.subtitle));
    expectEmbedSafeSvg(svg);
  });

  it('never gates render: a subtitle with no real fact still renders', () => {
    const noFact = scene(
      buildHistorySnapshot({ handle: 'quiet-hand', repositories: [], contributionDays: [] }),
    );
    const contents = textContents(renderText(noFact));
    expect(noFact.subtitle.length).toBeGreaterThan(0);
    expect(contents).toContain(escapeXmlText(noFact.subtitle));
    expect(contents.length).toBeGreaterThan(0);
  });
});

describe('renderText in the full strip', () => {
  it('appears inside the mural, embed-safe, for the xml-hostile handle', () => {
    const hostile = scene(buildHistorySnapshot({ handle: '<b>&"weird' }));
    const svg = renderMuralSvg(hostile);
    expect(textContents(svg)).toContain(escapeXmlText(hostile.subtitle));
    expectEmbedSafeSvg(svg);
  });

  it('renders text for a single-era brand-new strip', () => {
    const svg = renderText(brandNewScene);
    expect(brandNewScene.eras).toHaveLength(1);
    expect(textContents(svg)).toContain(escapeXmlText(brandNewScene.subtitle));
  });
});
