import { describe, expect, it } from 'vitest';
import { fetchAuthoredCounts } from './fetch-authored-counts.js';
import type { HttpResponse, HttpTransport } from './http-transport.js';

class RecordingTransport implements HttpTransport {
  readonly requestedUrls: string[] = [];
  private readonly responsesByUrl: Map<string, HttpResponse | Error>;

  constructor(responsesByUrl: Record<string, HttpResponse | Error>) {
    this.responsesByUrl = new Map(Object.entries(responsesByUrl));
  }

  async get(url: string): Promise<HttpResponse> {
    this.requestedUrls.push(url);
    const response = this.responsesByUrl.get(url);
    if (!response) {
      throw new Error(`Unexpected request: ${url}`);
    }
    if (response instanceof Error) {
      throw response;
    }
    return response;
  }
}

function totalCountResponse(totalCount: number): HttpResponse {
  return { status: 200, headers: new Map(), body: JSON.stringify({ total_count: totalCount }) };
}

const pullRequestUrl = 'https://api.github.com/search/issues?q=author:OctoCat+type:pr&per_page=1';
const issueUrl = 'https://api.github.com/search/issues?q=author:OctoCat+type:issue&per_page=1';

describe('fetchAuthoredCounts', () => {
  it('queries opened PRs and issues by author and returns both total counts', async () => {
    const transport = new RecordingTransport({
      [pullRequestUrl]: totalCountResponse(37),
      [issueUrl]: totalCountResponse(12),
    });

    await expect(fetchAuthoredCounts('OctoCat', transport)).resolves.toEqual({
      pullRequestsOpenedCount: 37,
      issuesOpenedCount: 12,
    });
    expect(transport.requestedUrls.sort()).toEqual([issueUrl, pullRequestUrl].sort());
  });

  it('degrades one count to null on a non-200 response while the other resolves', async () => {
    const transport = new RecordingTransport({
      [pullRequestUrl]: { status: 403, headers: new Map(), body: 'rate limit exceeded' },
      [issueUrl]: totalCountResponse(9),
    });

    await expect(fetchAuthoredCounts('OctoCat', transport)).resolves.toEqual({
      pullRequestsOpenedCount: null,
      issuesOpenedCount: 9,
    });
  });

  it('degrades a count to null when the response body has no total_count', async () => {
    const transport = new RecordingTransport({
      [pullRequestUrl]: { status: 200, headers: new Map(), body: '{}' },
      [issueUrl]: totalCountResponse(5),
    });

    await expect(fetchAuthoredCounts('OctoCat', transport)).resolves.toEqual({
      pullRequestsOpenedCount: null,
      issuesOpenedCount: 5,
    });
  });

  it('degrades both counts to null when the transport throws, without escaping the error', async () => {
    const transport = new RecordingTransport({
      [pullRequestUrl]: new Error('network down'),
      [issueUrl]: new Error('network down'),
    });

    await expect(fetchAuthoredCounts('OctoCat', transport)).resolves.toEqual({
      pullRequestsOpenedCount: null,
      issuesOpenedCount: null,
    });
  });
});
