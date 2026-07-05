import type { FetchGitHubSnapshotResult } from './fetch-github-snapshot-result.js';

export type FormattedFetchOutcome = {
  exitCode: number;
  message: string;
};

export function formatFetchGitHubSnapshotResult(
  result: Exclude<FetchGitHubSnapshotResult, { kind: 'success' }>,
): FormattedFetchOutcome {
  switch (result.kind) {
    case 'not-found':
      return { exitCode: 2, message: `No such GitHub user: ${result.handle}` };
    case 'organization':
      return {
        exitCode: 3,
        message: `${result.handle} is an organization account; git-epic only supports users.`,
      };
    case 'rate-limited':
      return { exitCode: 4, message: rateLimitMessage(result.handle, result.retryAfterSeconds) };
  }
}

function rateLimitMessage(handle: string, retryAfterSeconds: number | null): string {
  if (retryAfterSeconds === null) {
    return `GitHub rate limit reached for ${handle}. Retry later.`;
  }

  return `GitHub rate limit reached for ${handle}. Retry after ${retryAfterSeconds} seconds.`;
}
