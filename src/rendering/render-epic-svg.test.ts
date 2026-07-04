import { describe, expect, it } from 'vitest';
import type { HistorySnapshot } from '../history-snapshot.js';
import { buildTimeline } from '../timeline/build-timeline.js';
import type { Timeline } from '../timeline/timeline.js';
import { renderEpicSvg } from './render-epic-svg.js';

const firstSparkSnapshot: HistorySnapshot = {
  handle: 'first-spark',
  accountCreatedDate: '2019-03-18',
  firstPublicActivityDate: '2019-03-20',
  capturedAtDate: '2026-07-04',
};

function firstSparkTimeline(): Timeline {
  return buildTimeline(firstSparkSnapshot, [
    {
      chapter: { kind: 'origin', date: '2019-03-20' },
      narration:
        'In the year 2019, the developer first set foot upon the public forge, and the epic began.',
    },
  ]);
}

describe('renderEpicSvg', () => {
  it('renders an 830x415 root with matching viewBox', () => {
    const svg = renderEpicSvg(firstSparkTimeline());
    expect(svg).toContain('width="830"');
    expect(svg).toContain('height="415"');
    expect(svg).toContain('viewBox="0 0 830 415"');
  });

  it('renders each segment as a hidden group revealed at its timeline start', () => {
    const timeline = firstSparkTimeline();
    const svg = renderEpicSvg(timeline);
    const hiddenGroups = svg.match(/<g opacity="0">/g) ?? [];
    expect(hiddenGroups.length).toBe(timeline.segments.length + 1);
    for (const segment of timeline.segments) {
      expect(svg).toContain(
        `<animate attributeName="opacity" begin="${segment.startSeconds}s" dur="${segment.durationSeconds}s"`,
      );
    }
  });

  it('renders the ambient layer with attribution, replay-end reveal, and an indefinite loop', () => {
    const timeline = firstSparkTimeline();
    const svg = renderEpicSvg(timeline);
    expect(svg).toContain('>The Epic of first-spark</text>');
    expect(svg).toContain('>✦ forge yours at git-epic.dev</text>');
    expect(svg).toContain(`begin="${timeline.replayEndSeconds}s"`);
    expect(svg).toContain('repeatCount="indefinite"');
  });

  it('renders the title card with the uppercased handle and origin year', () => {
    const svg = renderEpicSvg(firstSparkTimeline());
    expect(svg).toContain('THE EPIC OF FIRST-SPARK');
    expect(svg).toContain('2019');
  });

  it('contains no scripts, external references, or event attributes', () => {
    const svg = renderEpicSvg(firstSparkTimeline());
    expect(svg).not.toContain('<script');
    expect(svg).not.toContain('@import');
    expect(svg).not.toMatch(/\son\w+=/i);
    const withoutSvgNamespace = svg.replace('xmlns="http://www.w3.org/2000/svg"', '');
    expect(withoutSvgNamespace).not.toContain('http://');
    expect(withoutSvgNamespace).not.toContain('https://');
  });

  it('escapes a handle containing XML metacharacters', () => {
    const hostileSnapshot: HistorySnapshot = { ...firstSparkSnapshot, handle: 'a&b<c>' };
    const timeline = buildTimeline(hostileSnapshot, [
      { chapter: { kind: 'origin', date: '2019-03-20' }, narration: 'narration' },
    ]);
    const svg = renderEpicSvg(timeline);
    expect(svg).toContain('A&amp;B&lt;C&gt;');
    expect(svg).toContain('The Epic of a&amp;b&lt;c&gt;');
    expect(svg).not.toContain('a&b<c>');
  });
});
