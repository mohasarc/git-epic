import { describe, expect, it } from 'vitest';
import { detectChapters } from './chapters/detect-chapters.js';
import * as publicApi from './index.js';
import type {
  Chapter,
  FetchGitHubSnapshotResult,
  HistorySnapshot,
  HttpTransport,
  ParsedGitHubHandle,
} from './index.js';
import { narrateChapter } from './narration/narrate-chapter.js';
import { renderEpic } from './render-epic.js';
import { darkAgeScene } from './rendering/scenes/dark-age-scene.js';
import { flagshipRiseScene } from './rendering/scenes/flagship-rise-scene.js';
import { greatStreakScene } from './rendering/scenes/great-streak-scene.js';
import { languageEraScene } from './rendering/scenes/language-era-scene.js';
import { originScene } from './rendering/scenes/origin-scene.js';
import { prolificacyScene } from './rendering/scenes/prolificacy-scene.js';
import { starMilestoneScene } from './rendering/scenes/star-milestone-scene.js';
import { buildTimeline } from './timeline/build-timeline.js';
import type { ChapterSceneSegment } from './timeline/timeline.js';
import { buildHistorySnapshot } from './test-support/build-history-snapshot.js';
import { loadHistorySnapshotFixture } from './test-support/load-history-snapshot-fixture.js';

const fixtureFileNames = [
  'single-contribution-account.json',
  'brand-new-account.json',
  'rich-history-account.json',
  'fifteen-year-overflow.json',
  'mohasarc-captured.json',
];

describe('renderEpic', () => {
  for (const fixtureFileName of fixtureFileNames) {
    it(`renders a complete epic for ${fixtureFileName}`, () => {
      const svg = renderEpic(loadHistorySnapshotFixture(fixtureFileName));
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).toContain('>✦ forge yours at git-epic.dev</text>');
    });

    it(`renders byte-identical output across separately loaded snapshots for ${fixtureFileName}`, () => {
      const first = renderEpic(loadHistorySnapshotFixture(fixtureFileName));
      const second = renderEpic(loadHistorySnapshotFixture(fixtureFileName));
      expect(first === second).toBe(true);
    });
  }

  it('renders every surviving chapter narration for the rich history fixture', () => {
    const snapshot = loadHistorySnapshotFixture('rich-history-account.json');
    const svg = renderEpic(snapshot);

    for (const chapter of detectChapters(snapshot)) {
      expect(svg).toContain(narrateChapter(chapter));
    }
  });

  it('renders every scene kind for the rich history fixture', () => {
    const sceneVisualByKind = {
      origin: originScene,
      'dark-age': darkAgeScene,
      'great-streak': greatStreakScene,
      prolificacy: prolificacyScene,
      'flagship-rise': flagshipRiseScene,
      'star-milestone': starMilestoneScene,
      'language-era': languageEraScene,
    };
    const snapshot = loadHistorySnapshotFixture('rich-history-account.json');
    const narratedChapters = detectChapters(snapshot).map((chapter) => ({
      chapter,
      narration: narrateChapter(chapter),
    }));
    const sceneSegments = buildTimeline(snapshot, narratedChapters).segments.filter(
      (segment): segment is ChapterSceneSegment => segment.kind === 'chapter-scene',
    );

    const svg = renderEpic(snapshot);

    expect(new Set(sceneSegments.map((segment) => segment.chapter.kind))).toEqual(
      new Set(Object.keys(sceneVisualByKind)),
    );
    for (const segment of sceneSegments) {
      expect(svg).toContain(sceneVisualByKind[segment.chapter.kind](segment));
    }
  });

  it('renders the dark age narration caption when the chapter fires', () => {
    const darkAgeSnapshot = () =>
      buildHistorySnapshot({
        contributionDays: [
          { date: '2019-03-20', count: 1 },
          { date: '2019-09-17', count: 1 },
        ],
        capturedAtDate: '2019-09-20',
      });
    const svg = renderEpic(darkAgeSnapshot());
    expect(svg).toContain(
      'Then came the Dark Age: one hundred and eighty days, and not a single commit.',
    );
    expect(renderEpic(darkAgeSnapshot()) === svg).toBe(true);
  });
});

describe('entry point', () => {
  it('exports the render surface plus chapter and strengths entry points at runtime', () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      'WORLD_NAMES',
      'detectChapters',
      'narrateChapter',
      'renderMural',
      'scoreStrengths',
    ]);
  });

  it('exports the HistorySnapshot and Chapter types', () => {
    const snapshot: HistorySnapshot = {
      handle: 'type-check',
      accountCreatedDate: '2020-01-01',
      firstPublicActivityDate: null,
      capturedAtDate: '2026-07-04',
      contributionDays: [],
      followerCount: 0,
      repositories: [],
      pullRequestsOpenedCount: 0,
      issuesOpenedCount: 0,
    };
    const chapters: Chapter[] = publicApi.detectChapters(snapshot);
    expect(chapters.map((chapter) => publicApi.narrateChapter(chapter))).toEqual([
      'The chronicle is yet unwritten, and the epic has just begun.',
    ]);
    expect(publicApi.renderMural(snapshot).startsWith('<svg')).toBe(true);
  });

  it('exports live fetch contracts as types only', async () => {
    const parsedHandle: ParsedGitHubHandle = { lookup: 'OctoCat' };
    const result: FetchGitHubSnapshotResult = {
      kind: 'success',
      snapshot: {
        handle: parsedHandle.lookup,
        accountCreatedDate: '2020-01-01',
        firstPublicActivityDate: null,
        capturedAtDate: '2026-07-04',
        contributionDays: [],
        followerCount: 0,
        repositories: [],
        pullRequestsOpenedCount: 0,
        issuesOpenedCount: 0,
      },
    };
    const transport: HttpTransport = {
      async get() {
        return { status: 200, headers: new Map(), body: '{}' };
      },
    };

    expect(result.snapshot.handle).toBe('OctoCat');
    await expect(transport.get('https://api.github.com/users/OctoCat')).resolves.toEqual({
      status: 200,
      headers: new Map(),
      body: '{}',
    });
    expect(Object.keys(publicApi).sort()).toEqual([
      'WORLD_NAMES',
      'detectChapters',
      'narrateChapter',
      'renderMural',
      'scoreStrengths',
    ]);
  });
});
