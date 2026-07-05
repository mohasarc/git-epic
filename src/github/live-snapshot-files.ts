import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { HistorySnapshot } from '../history-snapshot.js';
import { stableHistorySnapshotJson } from './stable-history-snapshot-json.js';

export type WriteCapturedSnapshotFileOptions = {
  force?: boolean;
};

export function writeCapturedSnapshotFile(
  snapshot: HistorySnapshot,
  outputPath: string,
  options?: WriteCapturedSnapshotFileOptions,
): void {
  if (existsSync(outputPath) && !options?.force) {
    throw new Error(`Refusing to overwrite existing file: ${outputPath}`);
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, stableHistorySnapshotJson(snapshot));
}
