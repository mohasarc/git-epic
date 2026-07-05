import { fetchGitHubSnapshot } from '../github/fetch-github-snapshot.js';
import { parseGitHubHandleInput } from '../github/github-handle.js';
import type { HttpTransport } from '../github/http-transport.js';
import { renderEpic } from '../render-epic.js';
import { renderMural } from '../render-mural.js';
import { renderNoSuchLegendCard } from '../rendering/cards/no-such-legend-card.js';
import { renderStillBeingWrittenCard } from '../rendering/cards/still-being-written-card.js';
import type { EpicCache, EpicCacheEntry } from './epic-cache.js';
import { epicCacheControlSeconds, freshnessAgeMs, isEpicFresh } from './epic-freshness.js';
import type { ImageResponse } from './image-response.js';

export type ImageRequestDependencies = {
  transport: HttpTransport;
  cache: EpicCache;
  nowIso: string;
};

export type EpicVariant = 'cosmic' | 'mural';

const CARD_MAX_AGE_SECONDS = 300;

export async function handleImageRequest(
  requestedHandle: string,
  { transport, cache, nowIso }: ImageRequestDependencies,
  variant: EpicVariant = 'cosmic',
): Promise<ImageResponse> {
  const parsedHandle = parseGitHubHandleInput(requestedHandle);
  if (parsedHandle.kind === 'invalid') {
    return cardResponse(renderNoSuchLegendCard(requestedHandle));
  }

  const handleKey = parsedHandle.handle.lookup.toLowerCase();
  const cacheKey = variant === 'mural' ? `${handleKey}:mural` : handleKey;
  const cachedEntry = await cache.get(cacheKey);
  if (cachedEntry && isEpicFresh(nowIso, cachedEntry.renderedAtIso)) {
    return epicResponse(cachedEntry, nowIso);
  }

  let fetchResult;
  try {
    fetchResult = await fetchGitHubSnapshot(requestedHandle, {
      transport,
      capturedAtDate: nowIso.slice(0, 10),
    });
  } catch {
    return unavailableResponse(cachedEntry);
  }

  switch (fetchResult.kind) {
    case 'success': {
      const render = variant === 'mural' ? renderMural : renderEpic;
      const entry: EpicCacheEntry = {
        document: render(fetchResult.snapshot),
        renderedAtIso: nowIso,
      };
      await cache.set(cacheKey, entry);
      return epicResponse(entry, nowIso);
    }
    case 'not-found':
    case 'organization':
      return cardResponse(renderNoSuchLegendCard(requestedHandle));
    case 'rate-limited':
      return unavailableResponse(cachedEntry);
  }
}

function unavailableResponse(cachedEntry: EpicCacheEntry | null): ImageResponse {
  if (cachedEntry) {
    return svgResponse(cachedEntry.document, CARD_MAX_AGE_SECONDS);
  }
  return cardResponse(renderStillBeingWrittenCard());
}

function epicResponse(entry: EpicCacheEntry, nowIso: string): ImageResponse {
  const maxAgeSeconds = epicCacheControlSeconds(freshnessAgeMs(nowIso, entry.renderedAtIso));
  return svgResponse(entry.document, maxAgeSeconds);
}

function cardResponse(document: string): ImageResponse {
  return svgResponse(document, CARD_MAX_AGE_SECONDS);
}

function svgResponse(body: string, maxAgeSeconds: number): ImageResponse {
  return {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': `public, max-age=${maxAgeSeconds}`,
    },
    body,
  };
}
