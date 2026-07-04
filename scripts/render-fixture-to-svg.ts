import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import type { HistorySnapshot } from '../src/history-snapshot.js';
import { renderEpic } from '../src/render-epic.js';

const [fixturePath, outputPathArgument] = process.argv.slice(2);
if (!fixturePath) {
  console.error('usage: pnpm render-fixture <fixture-path> [output-path]');
  process.exit(1);
}

const snapshot = JSON.parse(readFileSync(fixturePath, 'utf8')) as HistorySnapshot;
const outputPath = outputPathArgument ?? join('temp', `${basename(fixturePath, '.json')}.svg`);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, renderEpic(snapshot));
console.log(outputPath);
