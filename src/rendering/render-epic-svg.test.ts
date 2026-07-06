import { describe, expect, it } from 'vitest';
import { detectChapters } from '../chapters/detect-chapters.js';
import type { HistorySnapshot } from '../history-snapshot.js';
import { narrateChapter } from '../narration/narrate-chapter.js';
import { expectEmbedSafeSvg } from '../test-support/expect-embed-safe-svg.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { buildTimeline } from '../timeline/build-timeline.js';
import type { Timeline } from '../timeline/timeline.js';
import { renderEpicSvg } from './render-epic-svg.js';

const firstSparkSnapshot: HistorySnapshot = {
  handle: 'first-spark',
  accountCreatedDate: '2019-03-18',
  firstPublicActivityDate: '2019-03-20',
  capturedAtDate: '2026-07-04',
  contributionDays: [],
  followerCount: 0,
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

  it('dispatches a great-streak chapter to its scene, not the placeholder', () => {
    const timeline = buildTimeline(firstSparkSnapshot, [
      {
        chapter: { kind: 'great-streak', date: '2019-03-01', endDate: '2019-04-04', lengthDays: 35 },
        narration: 'Then began the relentless campaign.',
      },
    ]);
    const svg = renderEpicSvg(timeline);
    expect(svg).toContain('to="440 -64" fill="freeze"');
    expect(svg).not.toContain('r="40" fill="url(#spark-glow)"');
  });

  it('renders all seven distinct scenes for a rich history, with the placeholder gone', () => {
    const snapshot = loadHistorySnapshotFixture('rich-history-account.json');
    const narratedChapters = detectChapters(snapshot).map((chapter) => ({
      chapter,
      narration: narrateChapter(chapter),
    }));
    const svg = renderEpicSvg(buildTimeline(snapshot, narratedChapters));

    const sceneMarkers = {
      origin: 'values="14;70"',
      'flagship-rise': 'to="0 -46"',
      'star-milestone': 'r="1.8" fill="#ffd27d"',
      prolificacy: 'r="2" fill="#ffd27d" opacity="0"',
      'language-era': 'values="0.15;0.9"',
      'dark-age': 'width="830" height="415" fill="#070b14" opacity="0.55"',
      'great-streak': 'to="440 -64"',
    };
    for (const marker of Object.values(sceneMarkers)) {
      expect(svg).toContain(marker);
    }
    expect(svg).not.toContain('r="40" fill="url(#spark-glow)"');
  });

  it('dispatches a dark-age chapter to its scene, not the placeholder', () => {
    const timeline = buildTimeline(firstSparkSnapshot, [
      {
        chapter: { kind: 'dark-age', date: '2019-09-02', endDate: '2020-03-31', lengthDays: 212 },
        narration: 'Then came the Dark Age.',
      },
    ]);
    const svg = renderEpicSvg(timeline);
    expect(svg).toContain('width="830" height="415" fill="#070b14" opacity="0.55"');
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

  it('renders the floor ambient — one orbiting body, eight twinkles — for a zero-history snapshot', () => {
    const svg = renderEpicSvg(firstSparkTimeline());
    const orbitingBodies = svg.match(/<circle[^>]*r="2\.2"/g) ?? [];
    const twinkles = svg.match(/values="0\.2;0\.8;0\.2"/g) ?? [];
    expect(orbitingBodies.length).toBe(1);
    expect(twinkles.length).toBe(8);
    expect(svg).toContain(`fill="#9ad2ff"`);
  });

  it('renders one orbiting body per derived count, varied by index in radius, period, and accent', () => {
    const threeRepoSnapshot: HistorySnapshot = {
      ...firstSparkSnapshot,
      repositories: [
        {
          name: 'stellar-forge',
          createdDate: '2020-01-01',
          lastPushedDate: '2024-05-01',
          starCount: 900,
          forkCount: 0,
          isFork: false,
          primaryLanguage: 'TypeScript',
        },
        {
          name: 'ember-chronicle',
          createdDate: '2021-02-03',
          lastPushedDate: '2024-04-01',
          starCount: 140,
          forkCount: 0,
          isFork: false,
          primaryLanguage: 'Rust',
        },
        {
          name: 'quiet-archive',
          createdDate: '2022-06-09',
          lastPushedDate: null,
          starCount: 0,
          forkCount: 0,
          isFork: false,
          primaryLanguage: null,
        },
      ],
    };
    const timeline = buildTimeline(threeRepoSnapshot, [
      { chapter: { kind: 'origin', date: '2019-03-20' }, narration: 'narration' },
    ]);
    const svg = renderEpicSvg(timeline);

    const orbitingBodies = svg.match(/<circle[^>]*r="2\.2"[^>]*\/>/g) ?? [];
    expect(orbitingBodies.length).toBe(3);
    expect(orbitingBodies[0]).toContain('cx="503"');
    expect(orbitingBodies[1]).toContain('cx="490"');
    expect(orbitingBodies[2]).toContain('cx="477"');
    expect(orbitingBodies[0]).toContain('fill="#9ad2ff"');
    expect(orbitingBodies[1]).toContain('fill="#9aa8ff"');
    expect(orbitingBodies[2]).toContain('fill="#9ad2ff"');
    for (const duration of ['dur="14s"', 'dur="18s"', 'dur="22s"']) {
      expect(svg).toContain(duration);
    }
  });

  it('renders the banded twinkle count while core, halo, and attribution stay fixed', () => {
    const starredSnapshot: HistorySnapshot = {
      ...firstSparkSnapshot,
      repositories: [
        {
          name: 'stellar-forge',
          createdDate: '2020-01-01',
          lastPushedDate: '2024-05-01',
          starCount: 1040,
          forkCount: 0,
          isFork: false,
          primaryLanguage: 'TypeScript',
        },
      ],
    };
    const timeline = buildTimeline(starredSnapshot, [
      { chapter: { kind: 'origin', date: '2019-03-20' }, narration: 'narration' },
    ]);
    const svg = renderEpicSvg(timeline);

    const twinkles = svg.match(/values="0\.2;0\.8;0\.2"/g) ?? [];
    expect(twinkles.length).toBe(14);
    expect(svg).toContain('r="88" fill="none" stroke="#9aa8ff"');
    expect(svg).toContain('values="6;9;6"');
    expect(svg).toContain('>The Epic of first-spark</text>');
    expect(svg).toContain('>✦ forge yours at git-epic.dev</text>');
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
