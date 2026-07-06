import { fetchGitHubSnapshot } from '../github/fetch-github-snapshot.js';
import { parseGitHubHandleInput } from '../github/github-handle.js';
import type { HttpTransport } from '../github/http-transport.js';
import { renderEpic } from '../render-epic.js';
import type { HistorySnapshot } from '../history-snapshot.js';
import { renderMural, renderMuralExport } from '../render-mural.js';
import { resolveWorldName } from '../mural/worlds/resolve-world-name.js';
import type { WorldName } from '../mural/worlds/world.js';
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

export type EpicVariant = 'cosmic' | 'mural' | 'static';

const CARD_MAX_AGE_SECONDS = 300;

export async function handleImageRequest(
  requestedHandle: string,
  { transport, cache, nowIso }: ImageRequestDependencies,
  variant: EpicVariant = 'cosmic',
  requestedWorld: string | null = null,
): Promise<ImageResponse> {
  const parsedHandle = parseGitHubHandleInput(requestedHandle);
  if (parsedHandle.kind === 'invalid') {
    return cardResponse(renderNoSuchLegendCard(requestedHandle));
  }

  const handleKey = parsedHandle.handle.lookup.toLowerCase();
  const worldName = resolveWorldName(requestedWorld, handleKey);
  const cacheKey = variant === 'cosmic' ? handleKey : `${handleKey}:${variant}:${worldName}`;
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
      const document = renderVariant(variant, fetchResult.snapshot, worldName);
      const entry: EpicCacheEntry = {
        document,
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

function renderVariant(variant: EpicVariant, snapshot: HistorySnapshot, worldName: WorldName): string {
  switch (variant) {
    case 'mural':
      return renderMural(snapshot, worldName);
    case 'static':
      return renderMuralExport(snapshot, worldName);
    case 'cosmic':
      return renderEpic(snapshot);
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
