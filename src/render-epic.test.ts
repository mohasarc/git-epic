import { describe, expect, it } from 'vitest';
import * as publicApi from './index.js';
import type { HistorySnapshot } from './index.js';
import { renderEpic } from './render-epic.js';
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
    };
    expect(publicApi.renderEpic(snapshot).startsWith('<svg')).toBe(true);
  });
});
