import { renderStillBeingWrittenCard } from '../rendering/cards/still-being-written-card.js';
import { handleImageRequest, type ImageRequestDependencies } from './handle-image-request.js';
import type { ImageResponse } from './image-response.js';

export type ServiceRequest = { method: string | undefined; url: string | undefined };

const SVG_SUFFIX = '.svg';
const CARD_MAX_AGE_SECONDS = 300;

export async function routeServiceRequest(
  request: ServiceRequest,
  deps: ImageRequestDependencies,
): Promise<ImageResponse> {
  try {
    return await routeToImageHandler(request, deps);
  } catch {
    return placeholderResponse();
  }
}

async function routeToImageHandler(
  request: ServiceRequest,
  deps: ImageRequestDependencies,
): Promise<ImageResponse> {
  const method = request.method ?? 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    return methodNotAllowedResponse();
  }

  const pathname = (request.url ?? '').split('?')[0];
  if (!pathname.endsWith(SVG_SUFFIX)) {
    return notFoundResponse();
  }

  const requestedHandle = decodeURIComponent(pathname.slice(1, -SVG_SUFFIX.length));
  const response = await handleImageRequest(requestedHandle, deps);
  return method === 'HEAD' ? { ...response, body: '' } : response;
}

function methodNotAllowedResponse(): ImageResponse {
  return {
    status: 405,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET' },
    body: 'Method not allowed',
  };
}

function notFoundResponse(): ImageResponse {
  return {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body: 'Not found',
  };
}

function placeholderResponse(): ImageResponse {
  return {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': `public, max-age=${CARD_MAX_AGE_SECONDS}`,
    },
    body: renderStillBeingWrittenCard(),
  };
}
