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
import { renderAccessibility } from './accessibility.js';

function narrate(snapshot: HistorySnapshot): NarratedChapter[] {
  return detectChapters(snapshot).map((chapter) => ({ chapter, narration: narrateChapter(chapter) }));
}

function scene(snapshot: HistorySnapshot): MuralScene {
  return buildMuralScene(snapshot, narrate(snapshot), scoreStrengths(snapshot));
}

const richScene = scene(loadHistorySnapshotFixture('rich-history-account.json'));

describe('renderAccessibility', () => {
  it('carries the handle in <title> and the narration in <desc>', () => {
    const svg = renderAccessibility(richScene);
    const title = svg.match(/<title>([^<]*)<\/title>/);
    const desc = svg.match(/<desc>([^<]*)<\/desc>/);
    expect(title?.[1]).toBe(escapeXmlText(richScene.accessibleTitle));
    expect(title?.[1]).toContain(escapeXmlText(richScene.handle));
    expect(desc?.[1]).toBe(escapeXmlText(richScene.accessibleDescription));
  });

  it('escapes the xml-hostile handle and never emits a url in <desc>', () => {
    const hostile = scene(buildHistorySnapshot({ handle: '<b>&"weird' }));
    const svg = renderAccessibility(hostile);
    expect(svg).not.toContain('<b>&');
    const desc = svg.match(/<desc>([^<]*)<\/desc>/)?.[1] ?? '';
    expect(desc).not.toContain('http');
    expectEmbedSafeSvg(svg);
  });

  it('emits <title> and <desc> as the first children of the svg', () => {
    const svg = renderMuralSvg(richScene);
    expect(svg).toMatch(/<svg[^>]*><title>/);
    const titleIndex = svg.indexOf('<title>');
    const descIndex = svg.indexOf('<desc>');
    const defsIndex = svg.indexOf('<defs');
    expect(titleIndex).toBeGreaterThanOrEqual(0);
    expect(descIndex).toBeGreaterThan(titleIndex);
    expect(defsIndex).toBeGreaterThan(descIndex);
  });
});
