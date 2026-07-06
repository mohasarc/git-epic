import { describe, expect, it } from 'vitest';
import { githubApiTransport } from './github-api-transport.js';
import type { HttpResponse, HttpTransport } from './http-transport.js';

class RecordingTransport implements HttpTransport {
  readonly calls: { url: string; headers?: Readonly<Record<string, string>> }[] = [];

  async get(url: string, headers?: Readonly<Record<string, string>>): Promise<HttpResponse> {
    this.calls.push({ url, headers });
    return { status: 200, headers: new Map(), body: '' };
  }
}

const apiUrl = 'https://api.github.com/users/OctoCat/repos?type=owner';
const calendarUrl = 'https://github.com/users/OctoCat/contributions';

describe('githubApiTransport', () => {
  it('adds a bearer authorization header on api.github.com requests', async () => {
    const inner = new RecordingTransport();
    await githubApiTransport('secret-token', inner).get(apiUrl);

    expect(inner.calls).toEqual([{ url: apiUrl, headers: { Authorization: 'Bearer secret-token' } }]);
  });

  it('adds no authorization header on the github.com calendar host', async () => {
    const inner = new RecordingTransport();
    await githubApiTransport('secret-token', inner).get(calendarUrl);

    expect(inner.calls).toEqual([{ url: calendarUrl, headers: undefined }]);
  });

  it('forwards every call unchanged when no token is supplied', async () => {
    const inner = new RecordingTransport();
    const transport = githubApiTransport(undefined, inner);

    await transport.get(apiUrl);
    await transport.get(calendarUrl, { 'X-Custom': '1' });

    expect(inner.calls).toEqual([
      { url: apiUrl, headers: undefined },
      { url: calendarUrl, headers: { 'X-Custom': '1' } },
    ]);
  });

  it('merges the bearer header with caller-supplied headers on api requests', async () => {
    const inner = new RecordingTransport();
    await githubApiTransport('secret-token', inner).get(apiUrl, { Accept: 'application/vnd.github+json' });

    expect(inner.calls).toEqual([
      {
        url: apiUrl,
        headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer secret-token' },
      },
    ]);
  });
});
