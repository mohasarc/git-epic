import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { HistorySnapshot } from '../history-snapshot.js';
import { renderEpic } from '../render-epic.js';
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

export function writeRenderedSnapshotFile(snapshot: HistorySnapshot, outputPath: string): void {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, renderEpic(snapshot));
}
