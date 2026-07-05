import { describe, expect, it } from 'vitest';
import type { HistorySnapshot } from '../history-snapshot.js';
import type { HttpResponse, HttpTransport } from './http-transport.js';
import { fetchGitHubSnapshot } from './fetch-github-snapshot.js';
import { stableHistorySnapshotJson } from './stable-history-snapshot-json.js';

class FakeTransport implements HttpTransport {
  private readonly responses: HttpResponse[];

  constructor(responses: HttpResponse[]) {
    this.responses = [...responses];
  }

  async get(): Promise<HttpResponse> {
    const response = this.responses.shift();
    if (!response) {
      throw new Error('Unexpected request');
    }
    return response;
  }
}

function jsonResponse(value: unknown): HttpResponse {
  return {
    status: 200,
    headers: new Map(),
    body: JSON.stringify(value),
  };
}

function htmlResponse(body: string): HttpResponse {
  return {
    status: 200,
    headers: new Map(),
    body,
  };
}

function textResponse(status: number, body: string, headers?: Readonly<Record<string, string>>): HttpResponse {
  return {
    status,
    headers: new Map(Object.entries(headers ?? {})),
    body,
  };
}

describe('fetchGitHubSnapshot', () => {
  it('assembles a canonical history snapshot with injected capture date', async () => {
    const transport = new FakeTransport([
      jsonResponse({
        login: 'OctoCat',
        type: 'User',
        created_at: '2011-01-25T18:44:36Z',
        followers: 42,
      }),
      jsonResponse([
        {
          name: 'hello-world',
          created_at: '2012-02-01T00:00:00Z',
          pushed_at: '2019-04-01T00:00:00Z',
          stargazers_count: 80,
          forks_count: 12,
          fork: false,
          language: 'TypeScript',
        },
      ]),
      htmlResponse('<td data-date="2011-03-04" data-count="5"></td>'),
    ]);

    await expect(
      fetchGitHubSnapshot('octocat', { transport, capturedAtDate: '2026-07-05' }),
    ).resolves.toEqual({
      kind: 'success',
      snapshot: {
        handle: 'OctoCat',
        accountCreatedDate: '2011-01-25',
        firstPublicActivityDate: '2011-03-04',
        capturedAtDate: '2026-07-05',
        contributionDays: [{ date: '2011-03-04', count: 5 }],
        followerCount: 42,
        repositories: [
          {
            name: 'hello-world',
            createdDate: '2012-02-01',
            lastPushedDate: '2019-04-01',
            starCount: 80,
            forkCount: 12,
            isFork: false,
            primaryLanguage: 'TypeScript',
          },
        ],
      },
    });
  });

  it('uses repository creation as first activity when contributions are empty', async () => {
    const transport = new FakeTransport([
      jsonResponse({
        login: 'OctoCat',
        type: 'User',
        created_at: '2011-01-25T18:44:36Z',
      }),
      jsonResponse([
        {
          name: 'empty-start',
          created_at: '2012-02-01T00:00:00Z',
          pushed_at: null,
          stargazers_count: 0,
          language: null,
        },
      ]),
      htmlResponse('<td data-date="2012-03-04" data-count="0"></td>'),
    ]);

    const result = await fetchGitHubSnapshot('octocat', { transport, capturedAtDate: '2026-07-05' });

    expect(result).toMatchObject({
      kind: 'success',
      snapshot: { firstPublicActivityDate: '2012-02-01' },
    });
  });

  it('uses null first activity for accounts with no public activity', async () => {
    const transport = new FakeTransport([
      jsonResponse({
        login: 'OctoCat',
        type: 'User',
        created_at: '2011-01-25T18:44:36Z',
      }),
      jsonResponse([]),
      htmlResponse('<td data-date="2012-03-04" data-count="0"></td>'),
    ]);

    const result = await fetchGitHubSnapshot('octocat', { transport, capturedAtDate: '2026-07-05' });

    expect(result).toMatchObject({
      kind: 'success',
      snapshot: { firstPublicActivityDate: null },
    });
  });

  it('surfaces contribution calendar rate limits distinctly', async () => {
    const transport = new FakeTransport([
      jsonResponse({
        login: 'OctoCat',
        type: 'User',
        created_at: '2011-01-25T18:44:36Z',
      }),
      jsonResponse([]),
      textResponse(429, 'slow down', { 'retry-after': '30' }),
    ]);

    await expect(fetchGitHubSnapshot('octocat', { transport, capturedAtDate: '2026-07-05' })).resolves.toEqual({
      kind: 'rate-limited',
      handle: 'OctoCat',
      retryAfterSeconds: 30,
    });
  });
});

describe('stableHistorySnapshotJson', () => {
  const snapshot: HistorySnapshot = {
    handle: 'OctoCat',
    accountCreatedDate: '2011-01-25',
    firstPublicActivityDate: '2011-03-04',
    capturedAtDate: '2026-07-05',
    contributionDays: [{ date: '2011-03-04', count: 5 }],
    followerCount: 42,
    repositories: [
      {
        name: 'hello-world',
        createdDate: '2012-02-01',
        lastPushedDate: '2019-04-01',
        starCount: 80,
        forkCount: 12,
        isFork: false,
        primaryLanguage: 'TypeScript',
      },
    ],
  };

  it('serializes snapshots with stable field order', () => {
    expect(stableHistorySnapshotJson(snapshot)).toBe(`{
  "handle": "OctoCat",
  "accountCreatedDate": "2011-01-25",
  "firstPublicActivityDate": "2011-03-04",
  "capturedAtDate": "2026-07-05",
  "contributionDays": [
    {
      "date": "2011-03-04",
      "count": 5
    }
  ],
  "followerCount": 42,
  "repositories": [
    {
      "name": "hello-world",
      "createdDate": "2012-02-01",
      "lastPushedDate": "2019-04-01",
      "starCount": 80,
      "forkCount": 12,
      "isFork": false,
      "primaryLanguage": "TypeScript"
    }
  ]
}
`);
  });

  it('round-trips the snapshot key-for-key through parse and re-serialize', () => {
    const parsed = JSON.parse(stableHistorySnapshotJson(snapshot)) as HistorySnapshot;

    expect(parsed).toEqual(snapshot);
    expect(stableHistorySnapshotJson(parsed)).toBe(stableHistorySnapshotJson(snapshot));
  });
});
