import { describe, expect, it } from 'vitest';
import type { HttpResponse, HttpTransport } from '../github/http-transport.js';
import type { EpicCache } from './epic-cache.js';
import { createInMemoryEpicCache } from './in-memory-epic-cache.js';
import { routeServiceRequest } from './route-service-request.js';

const NOW_ISO = '2026-07-05T12:00:00.000Z';
const FRESH_DOCUMENT = '<svg>fresh</svg>';
const MURAL_DOCUMENT = '<svg>mural</svg>';

class UnusedTransport implements HttpTransport {
  async get(url: string): Promise<HttpResponse> {
    throw new Error(`unexpected request: ${url}`);
  }
}

async function freshCache(): Promise<EpicCache> {
  const cache = createInMemoryEpicCache();
  await cache.set('octocat', { document: FRESH_DOCUMENT, renderedAtIso: NOW_ISO });
  return cache;
}

function deps(cache: EpicCache) {
  return { transport: new UnusedTransport(), cache, nowIso: NOW_ISO };
}

describe('routeServiceRequest', () => {
  it('delegates a .svg GET to the image handler', async () => {
    const response = await routeServiceRequest({ method: 'GET', url: '/octocat.svg' }, deps(await freshCache()));

    expect(response.status).toBe(200);
    expect(response.headers['Content-Type']).toBe('image/svg+xml; charset=utf-8');
    expect(response.body).toBe(FRESH_DOCUMENT);
  });

  it('ignores the query string when resolving the handle', async () => {
    const response = await routeServiceRequest(
      { method: 'GET', url: '/octocat.svg?foo=bar&cachebust=1' },
      deps(await freshCache()),
    );

    expect(response.body).toBe(FRESH_DOCUMENT);
  });

  it('percent-decodes the path before resolving the handle', async () => {
    const response = await routeServiceRequest({ method: 'GET', url: '/oct%6fcat.svg' }, deps(await freshCache()));

    expect(response.body).toBe(FRESH_DOCUMENT);
  });

  it('returns 404 plain text for a non-svg path', async () => {
    for (const url of ['/', '/octocat']) {
      const response = await routeServiceRequest({ method: 'GET', url }, deps(await freshCache()));

      expect(response.status).toBe(404);
      expect(response.headers['Content-Type']).toBe('text/plain; charset=utf-8');
    }
  });

  it('returns 405 with Allow: GET for a non-GET method', async () => {
    for (const method of ['POST', 'PUT']) {
      const response = await routeServiceRequest({ method, url: '/octocat.svg' }, deps(await freshCache()));

      expect(response.status).toBe(405);
      expect(response.headers.Allow).toBe('GET');
      expect(response.headers['Content-Type']).toBe('text/plain; charset=utf-8');
    }
  });

  it('answers HEAD with the GET headers and an empty body', async () => {
    const getResponse = await routeServiceRequest({ method: 'GET', url: '/octocat.svg' }, deps(await freshCache()));
    const headResponse = await routeServiceRequest({ method: 'HEAD', url: '/octocat.svg' }, deps(await freshCache()));

    expect(headResponse.status).toBe(getResponse.status);
    expect(headResponse.headers).toEqual(getResponse.headers);
    expect(headResponse.body).toBe('');
  });

  it('routes ?preview=mural to the hash-default world cache key', async () => {
    const cache = await freshCache();
    await cache.set('octocat:mural:desert', { document: MURAL_DOCUMENT, renderedAtIso: NOW_ISO });

    const response = await routeServiceRequest(
      { method: 'GET', url: '/octocat.svg?preview=mural' },
      deps(cache),
    );

    expect(response.body).toBe(MURAL_DOCUMENT);
  });

  it('routes ?world to the matching per-world mural cache key', async () => {
    const cache = await freshCache();
    await cache.set('octocat:mural:river', { document: MURAL_DOCUMENT, renderedAtIso: NOW_ISO });

    const response = await routeServiceRequest(
      { method: 'GET', url: '/octocat.svg?preview=mural&world=river' },
      deps(cache),
    );

    expect(response.body).toBe(MURAL_DOCUMENT);
  });

  it('falls back to cosmic for a non-mural preview value', async () => {
    const cache = await freshCache();
    await cache.set('octocat:mural', { document: MURAL_DOCUMENT, renderedAtIso: NOW_ISO });

    const response = await routeServiceRequest(
      { method: 'GET', url: '/octocat.svg?preview=galaxy' },
      deps(cache),
    );

    expect(response.body).toBe(FRESH_DOCUMENT);
  });

  it('serves cosmic for the bare url even when a mural entry exists', async () => {
    const cache = await freshCache();
    await cache.set('octocat:mural', { document: MURAL_DOCUMENT, renderedAtIso: NOW_ISO });

    const response = await routeServiceRequest({ method: 'GET', url: '/octocat.svg' }, deps(cache));

    expect(response.body).toBe(FRESH_DOCUMENT);
  });

  it('answers HEAD for a mural preview with the GET headers and an empty body', async () => {
    const cache = await freshCache();
    await cache.set('octocat:mural:desert', { document: MURAL_DOCUMENT, renderedAtIso: NOW_ISO });

    const getResponse = await routeServiceRequest(
      { method: 'GET', url: '/octocat.svg?preview=mural' },
      deps(cache),
    );
    const headResponse = await routeServiceRequest(
      { method: 'HEAD', url: '/octocat.svg?preview=mural' },
      deps(cache),
    );

    expect(headResponse.status).toBe(getResponse.status);
    expect(headResponse.headers).toEqual(getResponse.headers);
    expect(headResponse.body).toBe('');
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
