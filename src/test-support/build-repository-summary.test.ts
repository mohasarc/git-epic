import { describe, expect, it } from 'vitest';

import { buildRepositorySummary } from './build-repository-summary.js';

describe('buildRepositorySummary', () => {
  it('defaults an owned repository with zero forks and non-fork status', () => {
    expect(buildRepositorySummary()).toEqual({
      name: 'symnav',
      createdDate: '2021-04-10',
      lastPushedDate: '2026-06-01',
      starCount: 0,
      forkCount: 0,
      isFork: false,
      primaryLanguage: 'TypeScript',
    });
  });

  it('replaces only the named fields', () => {
    const repository = buildRepositorySummary({ forkCount: 30, isFork: true });

    expect(repository.forkCount).toBe(30);
    expect(repository.isFork).toBe(true);
    expect(repository.name).toBe('symnav');
  });
});
