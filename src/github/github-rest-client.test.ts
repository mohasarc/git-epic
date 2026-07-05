import { describe, expect, it } from 'vitest';
import type { HttpResponse, HttpTransport } from './http-transport.js';
import { fetchGitHubPublicProfile } from './github-rest-client.js';

class FakeTransport implements HttpTransport {
  readonly requestedUrls: string[] = [];
  private readonly responses: HttpResponse[];

  constructor(responses: HttpResponse[]) {
    this.responses = [...responses];
  }

  async get(url: string): Promise<HttpResponse> {
    this.requestedUrls.push(url);
    const response = this.responses.shift();
    if (!response) {
      throw new Error(`Unexpected request: ${url}`);
    }
    return response;
  }
}

function jsonResponse(status: number, value: unknown, headers?: Readonly<Record<string, string>>): HttpResponse {
  return {
    status,
    headers: new Map(Object.entries(headers ?? {})),
    body: JSON.stringify(value),
  };
}

function textResponse(status: number, body: string, headers?: Readonly<Record<string, string>>): HttpResponse {
  return {
    status,
    headers: new Map(Object.entries(headers ?? {})),
    body,
  };
}

describe('fetchGitHubPublicProfile', () => {
  it('fetches a public user profile with canonical casing and UTC account date', async () => {
    const transport = new FakeTransport([
      jsonResponse(200, {
        login: 'OctoCat',
        type: 'User',
        created_at: '2011-01-25T18:44:36Z',
      }),
      jsonResponse(200, []),
    ]);

    await expect(
      fetchGitHubPublicProfile({ lookup: 'octocat' }, { transport }),
    ).resolves.toEqual({
      kind: 'success',
      profile: {
        login: 'OctoCat',
        accountCreatedDate: '2011-01-25',
        repositories: [],
      },
    });
    expect(transport.requestedUrls).toEqual([
      'https://api.github.com/users/octocat',
      'https://api.github.com/users/OctoCat/repos?type=owner&sort=created&direction=asc&per_page=100',
    ]);
  });

  it('returns not-found when GitHub cannot resolve the handle', async () => {
    const transport = new FakeTransport([jsonResponse(404, { message: 'Not Found' })]);

    await expect(fetchGitHubPublicProfile({ lookup: 'missing' }, { transport })).resolves.toEqual({
      kind: 'not-found',
      handle: 'missing',
    });
  });

  it('returns organization for organization accounts', async () => {
    const transport = new FakeTransport([
      jsonResponse(200, {
        login: 'GitHub',
        type: 'Organization',
        created_at: '2008-05-11T04:37:31Z',
      }),
    ]);

    await expect(fetchGitHubPublicProfile({ lookup: 'github' }, { transport })).resolves.toEqual({
      kind: 'organization',
      handle: 'GitHub',
    });
  });

  it('returns rate-limited for exhausted user lookup responses', async () => {
    const transport = new FakeTransport([
      textResponse(403, 'rate limit exceeded', {
        'x-ratelimit-remaining': '0',
        'retry-after': '60',
      }),
    ]);

    await expect(fetchGitHubPublicProfile({ lookup: 'octocat' }, { transport })).resolves.toEqual({
      kind: 'rate-limited',
      handle: 'octocat',
      retryAfterSeconds: 60,
    });
  });
});
