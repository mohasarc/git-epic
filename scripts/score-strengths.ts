import { readFileSync } from 'node:fs';
import type { HistorySnapshot } from '../src/history-snapshot.js';
import { scoreStrengths } from '../src/strengths/score-strengths.js';
import { stableStrengthsJson } from '../src/strengths/stable-strengths-json.js';

const [snapshotPath] = process.argv.slice(2);
if (!snapshotPath) {
  console.error('usage: pnpm score-strengths <path-to-snapshot.json>');
  process.exit(1);
}

const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8')) as HistorySnapshot;
process.stdout.write(stableStrengthsJson(scoreStrengths(snapshot)));
