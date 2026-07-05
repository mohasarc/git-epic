import type { HttpResponse, HttpTransport } from './http-transport.js';

export const defaultHttpTransport: HttpTransport = {
  async get(url, headers): Promise<HttpResponse> {
    const response = await fetch(url, { headers });
    return {
      status: response.status,
      headers: new Map(response.headers.entries()),
      body: await response.text(),
    };
  },
};
