import { fetchGitHubSnapshot } from '../src/github/fetch-github-snapshot.js';
import { formatFetchGitHubSnapshotResult } from '../src/github/format-fetch-github-snapshot-result.js';
import { writeCapturedSnapshotFile } from '../src/github/live-snapshot-files.js';

const [handle, outputPath, ...flags] = process.argv.slice(2);

if (!handle || !outputPath) {
  console.error('usage: pnpm capture-github-snapshot <handle> <output-json-path> [--force]');
  process.exit(1);
}

const result = await fetchGitHubSnapshot(handle);
if (result.kind !== 'success') {
  const formatted = formatFetchGitHubSnapshotResult(result);
  console.error(formatted.message);
  process.exit(formatted.exitCode);
}

try {
  writeCapturedSnapshotFile(result.snapshot, outputPath, { force: flags.includes('--force') });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

console.log(outputPath);
