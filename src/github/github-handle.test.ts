import { describe, expect, it } from 'vitest';
import { parseGitHubHandleInput } from './github-handle.js';

describe('parseGitHubHandleInput', () => {
  it('accepts GitHub login syntax and preserves lookup spelling', () => {
    expect(parseGitHubHandleInput('mohasarc')).toEqual({
      kind: 'valid',
      handle: { lookup: 'mohasarc' },
    });
    expect(parseGitHubHandleInput('  OctoCat  ')).toEqual({
      kind: 'valid',
      handle: { lookup: 'OctoCat' },
    });
    expect(parseGitHubHandleInput('a-39-character-handle-fits-here-abcde')).toEqual({
      kind: 'valid',
      handle: { lookup: 'a-39-character-handle-fits-here-abcde' },
    });
  });

  it('rejects values that cannot be GitHub logins', () => {
    const invalidInputs = [
      '',
      '   ',
      'owner/repo',
      'octocat@example.com',
      '-octocat',
      'octocat-',
      'octo--cat',
      'octo_cat',
      'a-40-character-handle-does-not-fit-here-ab',
    ];

    expect(invalidInputs.map((input) => parseGitHubHandleInput(input))).toEqual([
      { kind: 'invalid', reason: 'empty' },
      { kind: 'invalid', reason: 'empty' },
      { kind: 'invalid', reason: 'syntax' },
      { kind: 'invalid', reason: 'syntax' },
      { kind: 'invalid', reason: 'syntax' },
      { kind: 'invalid', reason: 'syntax' },
      { kind: 'invalid', reason: 'syntax' },
      { kind: 'invalid', reason: 'syntax' },
      { kind: 'invalid', reason: 'syntax' },
    ]);
  });
});
