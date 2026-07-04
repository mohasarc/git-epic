import type { RepositorySummary } from '../history-snapshot.js';

export function buildRepositorySummary(
  overrides?: Partial<RepositorySummary>,
): RepositorySummary {
  return {
    name: 'symnav',
    createdDate: '2021-04-10',
    lastPushedDate: '2026-06-01',
    starCount: 0,
    primaryLanguage: 'TypeScript',
    ...overrides,
  };
}
