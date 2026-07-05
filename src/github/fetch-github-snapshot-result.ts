import type { HistorySnapshot } from '../history-snapshot.js';

export type FetchGitHubSnapshotResult =
  | { kind: 'success'; snapshot: HistorySnapshot }
  | { kind: 'not-found'; handle: string }
  | { kind: 'organization'; handle: string }
  | { kind: 'rate-limited'; handle: string; retryAfterSeconds: number | null };
