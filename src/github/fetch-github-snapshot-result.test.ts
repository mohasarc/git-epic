import { describe, expect, it } from 'vitest';
import type { FetchGitHubSnapshotResult } from './fetch-github-snapshot-result.js';
import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';

function assertNever(value: never): never {
  throw new Error(`Unhandled fetch result: ${JSON.stringify(value)}`);
}

function describeFetchResult(result: FetchGitHubSnapshotResult): string {
  switch (result.kind) {
    case 'success':
      return result.snapshot.handle;
    case 'not-found':
      return `missing:${result.handle}`;
    case 'organization':
      return `organization:${result.handle}`;
    case 'rate-limited':
      return `retry:${result.retryAfterSeconds ?? 'unknown'}`;
    default:
      return assertNever(result);
  }
}

describe('FetchGitHubSnapshotResult', () => {
  it('names every live fetch outcome for exhaustive callers', () => {
    const results: FetchGitHubSnapshotResult[] = [
      { kind: 'success', snapshot: buildHistorySnapshot({ handle: 'OctoCat' }) },
      { kind: 'not-found', handle: 'missing' },
      { kind: 'organization', handle: 'github' },
      { kind: 'rate-limited', handle: 'octocat', retryAfterSeconds: null },
      { kind: 'rate-limited', handle: 'octocat', retryAfterSeconds: 60 },
    ];

    expect(results.map(describeFetchResult)).toEqual([
      'OctoCat',
      'missing:missing',
      'organization:github',
      'retry:unknown',
      'retry:60',
    ]);
  });
});
