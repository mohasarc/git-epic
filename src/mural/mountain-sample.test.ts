import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderMural } from '../render-mural.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';

describe('mountain sample', () => {
  it('pins the captured mohasarc mountain sample byte-for-byte', () => {
    const golden = readFileSync(
      fileURLToPath(new URL('../../examples/phase-4/mohasarc-captured.mountain.svg', import.meta.url)),
      'utf8',
    );
    expect(renderMural(loadHistorySnapshotFixture('mohasarc-captured.json'), 'mountain')).toBe(golden);
  });
});
