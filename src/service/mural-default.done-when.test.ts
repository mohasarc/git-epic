import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import type { HttpResponse, HttpTransport } from '../github/http-transport.js';
import { renderMural, renderMuralExport } from '../render-mural.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { resolveWorldName } from '../mural/worlds/resolve-world-name.js';
import { createInMemoryEpicCache } from './in-memory-epic-cache.js';
import { handleImageRequest } from './handle-image-request.js';
import { routeServiceRequest } from './route-service-request.js';

const RICH_FIXTURE = 'rich-history-account.json';
const RICH_HANDLE = 'saga-weaver';
const RICH_WORLD = resolveWorldName(null, RICH_HANDLE);
const NOW_ISO = '2026-07-05T12:00:00.000Z';

const MURAL_LAYER_MARKERS = ['id="mural-sky"', 'class="mural-plane', 'class="mural-era"', 'class="mural-finale"'];
const COSMIC_MARKERS = ['url(#nebula)', 'id="nebula"'];

function example(fileName: string): string {
  return readFileSync(fileURLToPath(new URL(`../../examples/stage-6/${fileName}`, import.meta.url)), 'utf8');
}

function successTransport(): HttpTransport {
  const profile = { login: RICH_HANDLE, type: 'User', created_at: '2011-01-25T18:44:36Z' };
  const repos = [
    {
      name: 'hello-world',
      created_at: '2012-02-01T00:00:00Z',
      pushed_at: '2019-04-01T00:00:00Z',
      stargazers_count: 80,
      language: 'TypeScript',
    },
  ];
  const contributionsHtml = '<td data-date="2011-03-04" data-count="5"></td>';
  const responses: HttpResponse[] = [
    { status: 200, headers: new Map(), body: JSON.stringify(profile) },
    { status: 200, headers: new Map(), body: JSON.stringify(repos) },
    { status: 200, headers: new Map(), body: contributionsHtml },
  ];
  return {
    async get() {
      const response = responses.shift();
      if (!response) throw new Error('unexpected request');
      return response;
    },
  };
}

function throwingTransport(): HttpTransport {
  return {
    async get() {
      throw new Error('upstream down');
    },
  };
}

describe('mural-default cutover done-when suite', () => {
  describe('extension routing serves the mural surfaces', () => {
    it('serves the animated mural on bare <handle>.svg and carries no cosmic markers', async () => {
      const response = await routeServiceRequest(
        { method: 'GET', url: `/${RICH_HANDLE}.svg` },
        { transport: successTransport(), cache: createInMemoryEpicCache(), nowIso: NOW_ISO },
      );
      for (const marker of MURAL_LAYER_MARKERS) expect(response.body).toContain(marker);
      for (const marker of COSMIC_MARKERS) expect(response.body).not.toContain(marker);
    });

    it('serves the static row-wrapped export on <handle>.png with no SMIL', async () => {
      const response = await routeServiceRequest(
        { method: 'GET', url: `/${RICH_HANDLE}.png` },
        { transport: successTransport(), cache: createInMemoryEpicCache(), nowIso: NOW_ISO },
      );
      expect(response.headers['Content-Type']).toBe('image/svg+xml; charset=utf-8');
      expect(response.body).toContain('id="export-row-0"');
      for (const token of ['<animate', '<animateTransform', 'calcMode="spline"', 'repeatCount']) {
        expect(response.body).not.toContain(token);
      }
    });
  });

  describe('fallback cards survive the cutover', () => {
    it('renders the no-such-legend card for an invalid handle on either extension', async () => {
      for (const extension of ['.svg', '.png']) {
        const response = await routeServiceRequest(
          { method: 'GET', url: `/not a handle${extension}` },
          { transport: successTransport(), cache: createInMemoryEpicCache(), nowIso: NOW_ISO },
        );
        expect(response.body).toContain('No such legend');
      }
    });

    it('renders the still-being-written card when upstream is down and nothing is cached', async () => {
      const response = await handleImageRequest(RICH_HANDLE, {
        transport: throwingTransport(),
        cache: createInMemoryEpicCache(),
        nowIso: NOW_ISO,
      });
      expect(response.body).toContain('still being written');
    });
  });

  describe('committed stage-6 samples match a fresh render', () => {
    const snapshot = loadHistorySnapshotFixture(RICH_FIXTURE);

    it('pins the animated mural sample bytes', () => {
      const svg = renderMural(snapshot, RICH_WORLD);
      expect(example(`${RICH_HANDLE}.svg`)).toBe(svg);
      for (const marker of MURAL_LAYER_MARKERS) expect(svg).toContain(marker);
      for (const marker of COSMIC_MARKERS) expect(svg).not.toContain(marker);
    });

    it('pins the static export sample bytes', () => {
      const staticSvg = renderMuralExport(snapshot, RICH_WORLD);
      expect(example(`${RICH_HANDLE}.png`)).toBe(staticSvg);
      expect(staticSvg).not.toContain('<animate');
    });
  });
});
