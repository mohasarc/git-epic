import { describe, expect, it } from 'vitest';
import * as publicApi from './index.js';
import type { HistorySnapshot } from './index.js';
import { renderEpic } from './render-epic.js';
import { buildHistorySnapshot } from './test-support/build-history-snapshot.js';
import { loadHistorySnapshotFixture } from './test-support/load-history-snapshot-fixture.js';

const fixtureFileNames = ['single-contribution-account.json', 'brand-new-account.json'];

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
  it('exports exactly renderEpic at runtime', () => {
    expect(Object.keys(publicApi).sort()).toEqual(['renderEpic']);
  });

  it('exports the HistorySnapshot type', () => {
    const snapshot: HistorySnapshot = {
      handle: 'type-check',
      accountCreatedDate: '2020-01-01',
      firstPublicActivityDate: null,
      capturedAtDate: '2026-07-04',
      contributionDays: [],
      repositories: [],
    };
    expect(publicApi.renderEpic(snapshot).startsWith('<svg')).toBe(true);
  });
});
