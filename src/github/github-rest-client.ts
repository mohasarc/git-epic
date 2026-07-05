import type { RepositorySummary } from '../history-snapshot.js';
import type { FetchGitHubSnapshotResult } from './fetch-github-snapshot-result.js';
import type { ParsedGitHubHandle } from './github-handle.js';
import type { HttpResponse, HttpTransport } from './http-transport.js';

export type GitHubPublicProfile = {
  login: string;
  accountCreatedDate: string;
  repositories: RepositorySummary[];
};

export type FetchGitHubPublicProfileResult =
  | { kind: 'success'; profile: GitHubPublicProfile }
  | Exclude<FetchGitHubSnapshotResult, { kind: 'success' }>;

export type GitHubRestClientOptions = {
  transport: HttpTransport;
};

type GitHubUserResponse = {
  login: string;
  type: string;
  created_at: string;
};

export async function fetchGitHubPublicProfile(
  handle: ParsedGitHubHandle,
  options: GitHubRestClientOptions,
): Promise<FetchGitHubPublicProfileResult> {
  const userResponse = await options.transport.get(`https://api.github.com/users/${handle.lookup}`);
  const userRateLimit = rateLimitedResult(userResponse, handle.lookup);
  if (userRateLimit) {
    return userRateLimit;
  }

  if (userResponse.status === 404) {
    return { kind: 'not-found', handle: handle.lookup };
  }

  const user = parseJson<GitHubUserResponse>(userResponse);
  if (user.type === 'Organization') {
    return { kind: 'organization', handle: user.login };
  }

  const repositories = await fetchRepositories(user.login, options.transport);
  if ('kind' in repositories) {
    return repositories;
  }

  return {
    kind: 'success',
    profile: {
      login: user.login,
      accountCreatedDate: toUtcDate(user.created_at),
      repositories,
    },
  };
}

async function fetchRepositories(
  login: string,
  transport: HttpTransport,
): Promise<RepositorySummary[] | Extract<FetchGitHubPublicProfileResult, { kind: 'rate-limited' }>> {
  const repositories: RepositorySummary[] = [];
  let nextUrl: string | null =
    `https://api.github.com/users/${login}/repos?type=owner&sort=created&direction=asc&per_page=100`;

  while (nextUrl) {
    const response = await transport.get(nextUrl);
    const rateLimit = rateLimitedResult(response, login);
    if (rateLimit) {
      return rateLimit;
    }

    repositories.push(...parseJson<GitHubRepositoryResponse[]>(response).map(toRepositorySummary));
    nextUrl = parseNextLink(response.headers.get('link'));
  }

  return repositories.sort((left, right) => left.createdDate.localeCompare(right.createdDate));
}

type GitHubRepositoryResponse = {
  name: string;
  created_at: string;
  pushed_at: string | null;
  stargazers_count: number;
  language: string | null;
};

function toRepositorySummary(repository: GitHubRepositoryResponse): RepositorySummary {
  return {
    name: repository.name,
    createdDate: toUtcDate(repository.created_at),
    lastPushedDate: repository.pushed_at ? toUtcDate(repository.pushed_at) : null,
    starCount: repository.stargazers_count,
    primaryLanguage: repository.language,
  };
}

function rateLimitedResult(
  response: HttpResponse,
  handle: string,
): Extract<FetchGitHubPublicProfileResult, { kind: 'rate-limited' }> | null {
  if ((response.status === 403 || response.status === 429) && response.headers.get('x-ratelimit-remaining') === '0') {
    return {
      kind: 'rate-limited',
      handle,
      retryAfterSeconds: parseRetryAfter(response.headers.get('retry-after')),
    };
  }

  return null;
}

function parseRetryAfter(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const seconds = Number(value);
  return Number.isInteger(seconds) && seconds >= 0 ? seconds : null;
}

function parseNextLink(linkHeader: string | undefined): string | null {
  if (!linkHeader) {
    return null;
  }

  for (const link of linkHeader.split(',')) {
    const match = link.match(/<([^>]+)>;\s*rel="next"/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function parseJson<Value>(response: HttpResponse): Value {
  return JSON.parse(response.body) as Value;
}

function toUtcDate(dateTime: string): string {
  return dateTime.slice(0, 10);
}
