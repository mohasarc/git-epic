import { describe, expect, it, vi } from 'vitest';
import type { HttpResponse, HttpTransport } from '../github/http-transport.js';
import { renderEpic } from '../render-epic.js';
import { renderMural } from '../render-mural.js';
import { fetchGitHubSnapshot } from '../github/fetch-github-snapshot.js';
import { expectEmbedSafeSvg } from '../test-support/expect-embed-safe-svg.js';
import type { EpicCacheEntry } from './epic-cache.js';
import { createInMemoryEpicCache } from './in-memory-epic-cache.js';
import { handleImageRequest } from './handle-image-request.js';

const NOW_ISO = '2026-07-05T12:00:00.000Z';

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

class ThrowingTransport implements HttpTransport {
  readonly requestedUrls: string[] = [];

  async get(url: string): Promise<HttpResponse> {
    this.requestedUrls.push(url);
    throw new Error('network down');
  }
}

function jsonResponse(value: unknown): HttpResponse {
  return { status: 200, headers: new Map(), body: JSON.stringify(value) };
}

function htmlResponse(body: string): HttpResponse {
  return { status: 200, headers: new Map(), body };
}

function textResponse(status: number, body: string, headers?: Record<string, string>): HttpResponse {
  return { status, headers: new Map(Object.entries(headers ?? {})), body };
}

const PROFILE = { login: 'OctoCat', type: 'User', created_at: '2011-01-25T18:44:36Z' };
const REPOS = [
  {
    name: 'hello-world',
    created_at: '2012-02-01T00:00:00Z',
    pushed_at: '2019-04-01T00:00:00Z',
    stargazers_count: 80,
    language: 'TypeScript',
  },
];
const CONTRIBUTIONS_HTML = '<td data-date="2011-03-04" data-count="5"></td>';

function successResponses(): HttpResponse[] {
  return [jsonResponse(PROFILE), jsonResponse(REPOS), htmlResponse(CONTRIBUTIONS_HTML)];
}

async function expectedEpicDocument(handle: string): Promise<string> {
  const result = await fetchGitHubSnapshot(handle, {
    transport: new FakeTransport(successResponses()),
    capturedAtDate: NOW_ISO.slice(0, 10),
  });
  if (result.kind !== 'success') {
    throw new Error('fixture transport did not produce a success snapshot');
  }
  return renderEpic(result.snapshot);
}

async function expectedMuralDocument(handle: string): Promise<string> {
  const result = await fetchGitHubSnapshot(handle, {
    transport: new FakeTransport(successResponses()),
    capturedAtDate: NOW_ISO.slice(0, 10),
  });
  if (result.kind !== 'success') {
    throw new Error('fixture transport did not produce a success snapshot');
  }
  return renderMural(result.snapshot);
}

function staleEntry(document: string): EpicCacheEntry {
  return { document, renderedAtIso: '2026-06-01T00:00:00.000Z' };
}

describe('handleImageRequest', () => {
  it('renders the no-such-legend card for invalid handle syntax without touching cache or transport', async () => {
    const cache = createInMemoryEpicCache();
    const getSpy = vi.spyOn(cache, 'get');
    const setSpy = vi.spyOn(cache, 'set');
    const transport = new FakeTransport([]);

    const response = await handleImageRequest('not a handle', { transport, cache, nowIso: NOW_ISO });

    expect(response.status).toBe(200);
    expect(response.headers['Content-Type']).toBe('image/svg+xml; charset=utf-8');
    expect(response.headers['Cache-Control']).toBe('public, max-age=300');
    expect(response.body).toContain('No such legend');
    expect(getSpy).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
    expect(transport.requestedUrls).toHaveLength(0);
  });

  it('serves a fresh cached entry without fetching or writing', async () => {
    const cache = createInMemoryEpicCache();
    await cache.set('octocat', { document: '<svg>cached</svg>', renderedAtIso: '2026-07-05T00:00:00.000Z' });
    const setSpy = vi.spyOn(cache, 'set');
    const transport = new FakeTransport([]);

    const response = await handleImageRequest('octocat', { transport, cache, nowIso: NOW_ISO });

    expect(response.body).toBe('<svg>cached</svg>');
    expect(transport.requestedUrls).toHaveLength(0);
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('fetches, renders, and caches when the entry is stale', async () => {
    const cache = createInMemoryEpicCache();
    await cache.set('octocat', staleEntry('<svg>old</svg>'));
    const setSpy = vi.spyOn(cache, 'set');
    const transport = new FakeTransport(successResponses());

    const response = await handleImageRequest('octocat', { transport, cache, nowIso: NOW_ISO });

    expect(response.body).toBe(await expectedEpicDocument('octocat'));
    expect(setSpy).toHaveBeenCalledWith('octocat', {
      document: await expectedEpicDocument('octocat'),
      renderedAtIso: NOW_ISO,
    });
  });

  it('fetches, renders, and caches when there is no entry', async () => {
    const cache = createInMemoryEpicCache();
    const setSpy = vi.spyOn(cache, 'set');
    const transport = new FakeTransport(successResponses());

    const response = await handleImageRequest('octocat', { transport, cache, nowIso: NOW_ISO });

    expect(response.body).toBe(await expectedEpicDocument('octocat'));
    expect(setSpy).toHaveBeenCalledTimes(1);
  });

  it('renders the no-such-legend card for a not-found handle without caching', async () => {
    const cache = createInMemoryEpicCache();
    const setSpy = vi.spyOn(cache, 'set');
    const transport = new FakeTransport([textResponse(404, JSON.stringify({ message: 'Not Found' }))]);

    const response = await handleImageRequest('ghost', { transport, cache, nowIso: NOW_ISO });

    expect(response.body).toContain('No such legend');
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('renders the no-such-legend card for an organization handle without caching', async () => {
    const cache = createInMemoryEpicCache();
    const setSpy = vi.spyOn(cache, 'set');
    const transport = new FakeTransport([jsonResponse({ login: 'github', type: 'Organization', created_at: '2008-01-01T00:00:00Z' })]);

    const response = await handleImageRequest('github', { transport, cache, nowIso: NOW_ISO });

    expect(response.body).toContain('No such legend');
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('renders the no-such-legend card for not-found even when a stale entry exists', async () => {
    const cache = createInMemoryEpicCache();
    await cache.set('ghost', staleEntry('<svg>old</svg>'));
    const transport = new FakeTransport([textResponse(404, JSON.stringify({ message: 'Not Found' }))]);

    const response = await handleImageRequest('ghost', { transport, cache, nowIso: NOW_ISO });

    expect(response.body).toContain('No such legend');
    expect(response.body).not.toBe('<svg>old</svg>');
  });

  it('renders the still-being-written placeholder when rate-limited with no entry', async () => {
    const cache = createInMemoryEpicCache();
    const setSpy = vi.spyOn(cache, 'set');
    const transport = new FakeTransport([
      jsonResponse(PROFILE),
      jsonResponse(REPOS),
      textResponse(429, 'slow down', { 'retry-after': '30' }),
    ]);

    const response = await handleImageRequest('octocat', { transport, cache, nowIso: NOW_ISO });

    expect(response.body).toContain('still being written');
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('renders the still-being-written placeholder when the transport throws with no entry', async () => {
    const cache = createInMemoryEpicCache();
    const setSpy = vi.spyOn(cache, 'set');
    const transport = new ThrowingTransport();

    const response = await handleImageRequest('octocat', { transport, cache, nowIso: NOW_ISO });

    expect(response.body).toContain('still being written');
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('serves the stale document when rate-limited with a stale entry', async () => {
    const cache = createInMemoryEpicCache();
    await cache.set('octocat', staleEntry('<svg>last-good</svg>'));
    const transport = new FakeTransport([
      jsonResponse(PROFILE),
      jsonResponse(REPOS),
      textResponse(429, 'slow down', { 'retry-after': '30' }),
    ]);

    const response = await handleImageRequest('octocat', { transport, cache, nowIso: NOW_ISO });

    expect(response.body).toBe('<svg>last-good</svg>');
  });

  it('serves the stale document when the transport throws with a stale entry', async () => {
    const cache = createInMemoryEpicCache();
    await cache.set('octocat', staleEntry('<svg>last-good</svg>'));
    const transport = new ThrowingTransport();

    const response = await handleImageRequest('octocat', { transport, cache, nowIso: NOW_ISO });

    expect(response.body).toBe('<svg>last-good</svg>');
  });

  it('sets Cache-Control from the epic age on a fresh hit', async () => {
    const cache = createInMemoryEpicCache();
    await cache.set('octocat', { document: '<svg>cached</svg>', renderedAtIso: '2026-07-05T00:00:00.000Z' });
    const transport = new FakeTransport([]);

    const response = await handleImageRequest('octocat', {
      transport,
      cache,
      nowIso: '2026-07-05T20:00:00.000Z',
    });

    expect(response.headers['Cache-Control']).toBe('public, max-age=14400');
  });

  it('caps Cache-Control at 300 for cards, placeholder, and stale-served epics', async () => {
    const card = await handleImageRequest('not a handle', {
      transport: new FakeTransport([]),
      cache: createInMemoryEpicCache(),
      nowIso: NOW_ISO,
    });
    expect(card.headers['Cache-Control']).toBe('public, max-age=300');

    const staleCache = createInMemoryEpicCache();
    await staleCache.set('octocat', staleEntry('<svg>last-good</svg>'));
    const stale = await handleImageRequest('octocat', {
      transport: new ThrowingTransport(),
      cache: staleCache,
      nowIso: NOW_ISO,
    });
    expect(stale.headers['Cache-Control']).toBe('public, max-age=300');
  });

  it('collapses case so MoHa and moha share the same cache key', async () => {
    const cache = createInMemoryEpicCache();
    const setSpy = vi.spyOn(cache, 'set');
    const transport = new FakeTransport(successResponses());

    const firstMixedCase = await handleImageRequest('OctoCat', { transport, cache, nowIso: NOW_ISO });
    const secondLowerCase = await handleImageRequest('octocat', { transport, cache, nowIso: NOW_ISO });

    expect(secondLowerCase.body).toBe(firstMixedCase.body);
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenCalledWith('octocat', expect.anything());
  });

  it('serves a byte-identical document across two in-window requests and writes once', async () => {
    const cache = createInMemoryEpicCache();
    const setSpy = vi.spyOn(cache, 'set');
    const transport = new FakeTransport(successResponses());

    const first = await handleImageRequest('octocat', { transport, cache, nowIso: NOW_ISO });
    const second = await handleImageRequest('octocat', { transport, cache, nowIso: NOW_ISO });

    expect(second.body).toBe(first.body);
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(transport.requestedUrls).toHaveLength(5);
  });

  it('renders and caches the mural variant under a :mural key', async () => {
    const cache = createInMemoryEpicCache();
    const setSpy = vi.spyOn(cache, 'set');
    const transport = new FakeTransport(successResponses());

    const response = await handleImageRequest('octocat', { transport, cache, nowIso: NOW_ISO }, 'mural');

    expect(response.body).toBe(await expectedMuralDocument('octocat'));
    expect(setSpy).toHaveBeenCalledWith('octocat:mural', {
      document: await expectedMuralDocument('octocat'),
      renderedAtIso: NOW_ISO,
    });
  });

  it('keeps cosmic and mural in distinct keys that never serve each other', async () => {
    const cache = createInMemoryEpicCache();

    const cosmic = await handleImageRequest(
      'octocat',
      { transport: new FakeTransport(successResponses()), cache, nowIso: NOW_ISO },
    );
    const mural = await handleImageRequest(
      'octocat',
      { transport: new FakeTransport(successResponses()), cache, nowIso: NOW_ISO },
      'mural',
    );

    expect(mural.body).not.toBe(cosmic.body);
    expect((await cache.get('octocat'))?.document).toBe(cosmic.body);
    expect((await cache.get('octocat:mural'))?.document).toBe(mural.body);
  });

  it('serves the mural from cache on the second hit without refetching', async () => {
    const cache = createInMemoryEpicCache();
    const transport = new FakeTransport(successResponses());

    const first = await handleImageRequest('octocat', { transport, cache, nowIso: NOW_ISO }, 'mural');
    const second = await handleImageRequest('octocat', { transport, cache, nowIso: NOW_ISO }, 'mural');

    expect(second.body).toBe(first.body);
    expect(transport.requestedUrls).toHaveLength(5);
  });

  it('renders the same no-such-legend card for a not-found handle across variants', async () => {
    const cosmic = await handleImageRequest(
      'ghost',
      { transport: new FakeTransport([textResponse(404, JSON.stringify({ message: 'Not Found' }))]), cache: createInMemoryEpicCache(), nowIso: NOW_ISO },
    );
    const mural = await handleImageRequest(
      'ghost',
      { transport: new FakeTransport([textResponse(404, JSON.stringify({ message: 'Not Found' }))]), cache: createInMemoryEpicCache(), nowIso: NOW_ISO },
      'mural',
    );

    expect(mural.body).toBe(cosmic.body);
    expect(mural.body).toContain('No such legend');
  });

  it('renders the same still-being-written placeholder when the transport throws across variants', async () => {
    const cosmic = await handleImageRequest(
      'octocat',
      { transport: new ThrowingTransport(), cache: createInMemoryEpicCache(), nowIso: NOW_ISO },
    );
    const mural = await handleImageRequest(
      'octocat',
      { transport: new ThrowingTransport(), cache: createInMemoryEpicCache(), nowIso: NOW_ISO },
      'mural',
    );

    expect(mural.body).toBe(cosmic.body);
    expect(mural.body).toContain('still being written');
  });

  it('keeps the body embed-safe for a hostile requested handle', async () => {
    const cache = createInMemoryEpicCache();
    const transport = new FakeTransport([]);

    const response = await handleImageRequest('<script>&"', { transport, cache, nowIso: NOW_ISO });

    expectEmbedSafeSvg(response.body);
  });
});
