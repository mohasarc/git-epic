import { describe, expect, it } from 'vitest';
import { detectChapters } from './chapters/detect-chapters.js';
import * as publicApi from './index.js';
import type { Chapter, HistorySnapshot } from './index.js';
import { narrateChapter } from './narration/narrate-chapter.js';
import { renderEpic } from './render-epic.js';
import { buildHistorySnapshot } from './test-support/build-history-snapshot.js';
import { loadHistorySnapshotFixture } from './test-support/load-history-snapshot-fixture.js';

const fixtureFileNames = [
  'single-contribution-account.json',
  'brand-new-account.json',
  'rich-history-account.json',
  'fifteen-year-overflow.json',
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
  it('exports exactly renderEpic, detectChapters, and narrateChapter at runtime', () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      'detectChapters',
      'narrateChapter',
      'renderEpic',
    ]);
  });

  it('exports the HistorySnapshot and Chapter types', () => {
    const snapshot: HistorySnapshot = {
      handle: 'type-check',
      accountCreatedDate: '2020-01-01',
      firstPublicActivityDate: null,
      capturedAtDate: '2026-07-04',
      contributionDays: [],
      repositories: [],
    };
    const chapters: Chapter[] = publicApi.detectChapters(snapshot);
    expect(chapters.map((chapter) => publicApi.narrateChapter(chapter))).toEqual([
      'The chronicle is yet unwritten, and the epic has just begun.',
    ]);
    expect(publicApi.renderEpic(snapshot).startsWith('<svg')).toBe(true);
  });
});
