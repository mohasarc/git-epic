import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { renderEpic } from '../render-epic.js';
import { formatFetchGitHubSnapshotResult } from './format-fetch-github-snapshot-result.js';
import { writeCapturedSnapshotFile, writeRenderedSnapshotFile } from './live-snapshot-files.js';

let temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
  temporaryDirectories = [];
});

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'git-epic-live-snapshot-'));
  temporaryDirectories.push(directory);
  return directory;
}

describe('formatFetchGitHubSnapshotResult', () => {
  it('formats expected non-success outcomes for CLI callers', () => {
    expect(formatFetchGitHubSnapshotResult({ kind: 'not-found', handle: 'missing' })).toEqual({
      exitCode: 2,
      message: 'No such GitHub user: missing',
    });
    expect(formatFetchGitHubSnapshotResult({ kind: 'organization', handle: 'GitHub' })).toEqual({
      exitCode: 3,
      message: 'GitHub is an organization account; git-epic only supports users.',
    });
    expect(
      formatFetchGitHubSnapshotResult({
        kind: 'rate-limited',
        handle: 'octocat',
        retryAfterSeconds: 60,
      }),
    ).toEqual({
      exitCode: 4,
      message: 'GitHub rate limit reached for octocat. Retry after 60 seconds.',
    });
    expect(
      formatFetchGitHubSnapshotResult({
        kind: 'rate-limited',
        handle: 'octocat',
        retryAfterSeconds: null,
      }),
    ).toEqual({
      exitCode: 4,
      message: 'GitHub rate limit reached for octocat. Retry later.',
    });
  });
});

describe('writeCapturedSnapshotFile', () => {
  it('creates parent directories and writes stable snapshot JSON', () => {
    const outputPath = join(temporaryDirectory(), 'nested', 'octocat.json');

    writeCapturedSnapshotFile(buildHistorySnapshot({ handle: 'OctoCat' }), outputPath);

    expect(readFileSync(outputPath, 'utf8')).toContain('"handle": "OctoCat"');
    expect(readFileSync(outputPath, 'utf8')).toMatch(/\n$/);
  });

  it('refuses to overwrite existing files unless force is set', () => {
    const outputPath = join(temporaryDirectory(), 'octocat.json');
    writeFileSync(outputPath, 'already here');

    expect(() => writeCapturedSnapshotFile(buildHistorySnapshot(), outputPath)).toThrow(
      `Refusing to overwrite existing file: ${outputPath}`,
    );

    writeCapturedSnapshotFile(buildHistorySnapshot({ handle: 'OctoCat' }), outputPath, { force: true });
    expect(readFileSync(outputPath, 'utf8')).toContain('"handle": "OctoCat"');
  });
});

describe('writeRenderedSnapshotFile', () => {
  it('writes the same SVG as rendering the captured snapshot directly', () => {
    const outputPath = join(temporaryDirectory(), 'nested', 'octocat.svg');
    const snapshot = buildHistorySnapshot({
      handle: 'OctoCat',
      contributionDays: [{ date: '2019-03-20', count: 1 }],
    });

    writeRenderedSnapshotFile(snapshot, outputPath);

    expect(readFileSync(outputPath, 'utf8')).toBe(renderEpic(snapshot));
  });
});
