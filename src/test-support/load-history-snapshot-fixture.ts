import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { HistorySnapshot } from '../history-snapshot.js';

const fixturesDirectoryUrl = new URL('../../test-fixtures/', import.meta.url);

export function loadHistorySnapshotFixture(fixtureFileName: string): HistorySnapshot {
  const fixturePath = fileURLToPath(new URL(fixtureFileName, fixturesDirectoryUrl));
  let fixtureJson: string;
  try {
    fixtureJson = readFileSync(fixturePath, 'utf8');
  } catch {
    throw new Error(`History snapshot fixture not found: ${fixturePath}`);
  }
  return JSON.parse(fixtureJson) as HistorySnapshot;
}
