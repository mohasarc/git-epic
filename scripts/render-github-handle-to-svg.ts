import { join } from 'node:path';
import { fetchGitHubSnapshot } from '../src/github/fetch-github-snapshot.js';
import { formatFetchGitHubSnapshotResult } from '../src/github/format-fetch-github-snapshot-result.js';
import { writeRenderedSnapshotFile } from '../src/github/live-snapshot-files.js';

const [handle, outputPathArgument] = process.argv.slice(2);

if (!handle) {
  console.error('usage: pnpm render-github-handle <handle> [output-svg-path]');
  process.exit(1);
}

const result = await fetchGitHubSnapshot(handle);
if (result.kind !== 'success') {
  const formatted = formatFetchGitHubSnapshotResult(result);
  console.error(formatted.message);
  process.exit(formatted.exitCode);
}

const outputPath = outputPathArgument ?? join('temp', `${result.snapshot.handle}.svg`);
writeRenderedSnapshotFile(result.snapshot, outputPath);
console.log(outputPath);
