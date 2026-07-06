import { defaultHttpTransport } from './default-http-transport.js';
import type { HttpTransport } from './http-transport.js';

const GITHUB_API_HOST = 'api.github.com';

export function githubApiTransport(
  token: string | undefined,
  inner: HttpTransport = defaultHttpTransport,
): HttpTransport {
  if (token === undefined) {
    return inner;
  }
  return {
    get(url, headers) {
      if (new URL(url).host !== GITHUB_API_HOST) {
        return inner.get(url, headers);
      }
      return inner.get(url, { ...headers, Authorization: `Bearer ${token}` });
    },
  };
}
