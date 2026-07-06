import { describe, expect, it } from 'vitest';
import type { HttpResponse, HttpTransport } from '../github/http-transport.js';
import type { EpicCache } from './epic-cache.js';
import { createInMemoryEpicCache } from './in-memory-epic-cache.js';
import { routeServiceRequest } from './route-service-request.js';

const NOW_ISO = '2026-07-05T12:00:00.000Z';
const MURAL_DOCUMENT = '<svg>mural</svg>';
const STATIC_DOCUMENT = '<svg>static</svg>';

class UnusedTransport implements HttpTransport {
  async get(url: string): Promise<HttpResponse> {
    throw new Error(`unexpected request: ${url}`);
  }
}

function deps(cache: EpicCache) {
  return { transport: new UnusedTransport(), cache, nowIso: NOW_ISO };
}

async function cacheWith(entries: Record<string, string>): Promise<EpicCache> {
  const cache = createInMemoryEpicCache();
  for (const [key, document] of Object.entries(entries)) {
    await cache.set(key, { document, renderedAtIso: NOW_ISO });
  }
  return cache;
}

describe('routeServiceRequest', () => {
  it('serves the mural for a bare .svg GET from the mural cache key', async () => {
    const cache = await cacheWith({ 'octocat:mural:desert': MURAL_DOCUMENT });

    const response = await routeServiceRequest({ method: 'GET', url: '/octocat.svg' }, deps(cache));

    expect(response.status).toBe(200);
    expect(response.headers['Content-Type']).toBe('image/svg+xml; charset=utf-8');
    expect(response.body).toBe(MURAL_DOCUMENT);
  });

  it('serves the static export for a .png GET from the static cache key', async () => {
    const cache = await cacheWith({ 'octocat:static:desert': STATIC_DOCUMENT });

    const response = await routeServiceRequest({ method: 'GET', url: '/octocat.png' }, deps(cache));

    expect(response.status).toBe(200);
    expect(response.headers['Content-Type']).toBe('image/svg+xml; charset=utf-8');
    expect(response.body).toBe(STATIC_DOCUMENT);
  });

  it('ignores the query string when resolving the handle', async () => {
    const cache = await cacheWith({ 'octocat:mural:desert': MURAL_DOCUMENT });

    const response = await routeServiceRequest(
      { method: 'GET', url: '/octocat.svg?foo=bar&cachebust=1' },
      deps(cache),
    );

    expect(response.body).toBe(MURAL_DOCUMENT);
  });

  it('percent-decodes the path before resolving the handle', async () => {
    const cache = await cacheWith({ 'octocat:mural:desert': MURAL_DOCUMENT });

    const response = await routeServiceRequest({ method: 'GET', url: '/oct%6fcat.svg' }, deps(cache));

    expect(response.body).toBe(MURAL_DOCUMENT);
  });

  it('routes ?world to the matching per-world mural cache key', async () => {
    const cache = await cacheWith({ 'octocat:mural:river': MURAL_DOCUMENT });

    const response = await routeServiceRequest(
      { method: 'GET', url: '/octocat.svg?world=river' },
      deps(cache),
    );

    expect(response.body).toBe(MURAL_DOCUMENT);
  });

  it('routes ?world on a .png to the matching per-world static cache key', async () => {
    const cache = await cacheWith({ 'octocat:static:river': STATIC_DOCUMENT });

    const response = await routeServiceRequest(
      { method: 'GET', url: '/octocat.png?world=river' },
      deps(cache),
    );

    expect(response.body).toBe(STATIC_DOCUMENT);
  });

  it('resolves an absent world to the hash default for both extensions', async () => {
    const cache = await cacheWith({
      'octocat:mural:desert': MURAL_DOCUMENT,
      'octocat:static:desert': STATIC_DOCUMENT,
    });

    const svg = await routeServiceRequest({ method: 'GET', url: '/octocat.svg' }, deps(cache));
    const png = await routeServiceRequest({ method: 'GET', url: '/octocat.png' }, deps(cache));

    expect(svg.body).toBe(MURAL_DOCUMENT);
    expect(png.body).toBe(STATIC_DOCUMENT);
  });

  it('returns 404 plain text for a path that is neither .svg nor .png', async () => {
    for (const url of ['/', '/octocat', '/octocat.gif']) {
      const response = await routeServiceRequest({ method: 'GET', url }, deps(createInMemoryEpicCache()));

      expect(response.status).toBe(404);
      expect(response.headers['Content-Type']).toBe('text/plain; charset=utf-8');
    }
  });

  it('returns 405 with Allow: GET for a non-GET method', async () => {
    for (const method of ['POST', 'PUT']) {
      const response = await routeServiceRequest({ method, url: '/octocat.svg' }, deps(createInMemoryEpicCache()));

      expect(response.status).toBe(405);
      expect(response.headers.Allow).toBe('GET');
      expect(response.headers['Content-Type']).toBe('text/plain; charset=utf-8');
    }
  });

  it('answers HEAD with the GET headers and an empty body for both extensions', async () => {
    const cache = await cacheWith({
      'octocat:mural:desert': MURAL_DOCUMENT,
      'octocat:static:desert': STATIC_DOCUMENT,
    });

    for (const url of ['/octocat.svg', '/octocat.png']) {
      const getResponse = await routeServiceRequest({ method: 'GET', url }, deps(cache));
      const headResponse = await routeServiceRequest({ method: 'HEAD', url }, deps(cache));

      expect(headResponse.status).toBe(getResponse.status);
      expect(headResponse.headers).toEqual(getResponse.headers);
      expect(headResponse.body).toBe('');
    }
  });

  it('returns the still-being-written placeholder at 200 when the handler throws', async () => {
    const throwingCache: EpicCache = {
      async get() {
        throw new Error('cache down');
      },
      async set() {},
    };

    const response = await routeServiceRequest(
      { method: 'GET', url: '/octocat.svg' },
      { transport: new UnusedTransport(), cache: throwingCache, nowIso: NOW_ISO },
    );

    expect(response.status).toBe(200);
    expect(response.headers['Content-Type']).toBe('image/svg+xml; charset=utf-8');
    expect(response.body).toContain('still being written');
  });
});
