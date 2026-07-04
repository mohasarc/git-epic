import { describe, expect, it } from 'vitest';
import type { HistorySnapshot } from '../history-snapshot.js';
import { expectEmbedSafeSvg } from '../test-support/expect-embed-safe-svg.js';
import { buildTimeline } from '../timeline/build-timeline.js';
import type { Timeline } from '../timeline/timeline.js';
import { renderEpicSvg } from './render-epic-svg.js';

const firstSparkSnapshot: HistorySnapshot = {
  handle: 'first-spark',
  accountCreatedDate: '2019-03-18',
  firstPublicActivityDate: '2019-03-20',
  capturedAtDate: '2026-07-04',
  contributionDays: [],
  repositories: [],
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
    expectEmbedSafeSvg(svg);
  });

  it('declares the gradients the universe style paints with', () => {
    const svg = renderEpicSvg(firstSparkTimeline());
    for (const gradientId of ['nebula', 'spark-glow', 'gilded', 'rule-fade']) {
      expect(svg).toContain(`id="${gradientId}"`);
    }
  });

  it('sets all text in the serif stack with a gilded-gradient title', () => {
    const svg = renderEpicSvg(firstSparkTimeline());
    expect(svg).toContain("Georgia, 'Times New Roman', serif");
    expect(svg).not.toContain('ui-sans-serif');
    expect(svg).toMatch(/<text[^>]*fill="url\(#gilded\)"[^>]*>THE EPIC OF FIRST-SPARK<\/text>/);
  });

  it('composes the narration caption as a gilded italic flanked by fading rules', () => {
    const timeline = firstSparkTimeline();
    const svg = renderEpicSvg(timeline);
    const narration = timeline.segments.find((segment) => segment.kind === 'chapter-scene');
    if (narration?.kind !== 'chapter-scene') throw new Error('expected a chapter scene');
    const literalNarration = narration.narration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    expect(svg).toMatch(
      new RegExp(
        `<text[^>]*fill="url\\(#gilded\\)"[^>]*font-style="italic"[^>]*>${literalNarration}</text>`,
      ),
    );
    expect(svg).toContain('fill="url(#rule-fade)"');
    expect(svg).not.toMatch(/<text[^>]*fill="#e8ecf5"[^>]*>In the year/);
  });

  it('dispatches a flagship-rise chapter to its scene, not the placeholder', () => {
    const timeline = buildTimeline(firstSparkSnapshot, [
      {
        chapter: { kind: 'flagship-rise', date: '2021-06-01', repoName: 'stellar-forge', starCount: 4200 },
        narration: 'And lo, stellar-forge rose among the constellations.',
      },
    ]);
    const svg = renderEpicSvg(timeline);
    expect(svg).toContain('<animateTransform attributeName="transform" type="translate"');
    expect(svg).not.toContain('r="40" fill="url(#spark-glow)"');
  });

  it('dispatches a star-milestone chapter to its scene, not the placeholder', () => {
    const timeline = buildTimeline(firstSparkSnapshot, [
      {
        chapter: { kind: 'star-milestone', date: '2022-01-05', threshold: 1000 },
        narration: 'A thousand stars now sang the name.',
      },
    ]);
    const svg = renderEpicSvg(timeline);
    const burstStars = svg.match(/<circle[^>]*r="1\.8" fill="#ffd27d"/g) ?? [];
    expect(burstStars.length).toBe(10);
    expect(svg).not.toContain('r="40" fill="url(#spark-glow)"');
  });

  it('dispatches a prolificacy chapter to its scene, not the placeholder', () => {
    const timeline = buildTimeline(firstSparkSnapshot, [
      {
        chapter: {
          kind: 'prolificacy',
          date: '2023-01-01',
          year: 2023,
          contributionCount: 1900,
          priorYearContributionCount: 400,
        },
        narration: 'In 2023 the forge never cooled.',
      },
    ]);
    const svg = renderEpicSvg(timeline);
    const bloomSparks = svg.match(/<circle[^>]*r="2" fill="#ffd27d" opacity="0">/g) ?? [];
    expect(bloomSparks.length).toBe(8);
    expect(svg).not.toContain('r="40" fill="url(#spark-glow)"');
  });

  it('dispatches a language-era chapter to its scene, not the placeholder', () => {
    const timeline = buildTimeline(firstSparkSnapshot, [
      {
        chapter: {
          kind: 'language-era',
          date: '2022-01-01',
          year: 2022,
          fromLanguage: 'JavaScript',
          toLanguage: 'TypeScript',
        },
        narration: 'In the year 2022, the developer forsook JavaScript.',
      },
    ]);
    const svg = renderEpicSvg(timeline);
    expect(svg).toContain('values="0.9;0.15"');
    expect(svg).toContain('values="0.15;0.9"');
    expect(svg).not.toContain('r="40" fill="url(#spark-glow)"');
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
