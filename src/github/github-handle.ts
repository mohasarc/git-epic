export type ParsedGitHubHandle = {
  lookup: string;
};

export type GitHubHandleParseResult =
  | { kind: 'valid'; handle: ParsedGitHubHandle }
  | { kind: 'invalid'; reason: 'empty' | 'syntax' };

const githubHandlePattern = /^(?!.*--)[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;

export function parseGitHubHandleInput(input: string): GitHubHandleParseResult {
  const lookup = input.trim();

  if (lookup.length === 0) {
    return { kind: 'invalid', reason: 'empty' };
  }

  if (!githubHandlePattern.test(lookup)) {
    return { kind: 'invalid', reason: 'syntax' };
  }

  return { kind: 'valid', handle: { lookup } };
}
