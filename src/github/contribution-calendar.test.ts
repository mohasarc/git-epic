import { describe, expect, it } from 'vitest';
import type { HttpResponse, HttpTransport } from './http-transport.js';
import { fetchContributionCalendar, parseContributionCalendarHtml } from './contribution-calendar.js';

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

function htmlResponse(body: string): HttpResponse {
  return {
    status: 200,
    headers: new Map(),
    body,
  };
}

describe('parseContributionCalendarHtml', () => {
  it('extracts non-zero contribution days sorted by date', () => {
    const html = `
      <td data-date="2020-01-03" data-count="2" aria-label="2 contributions on Jan 3, 2020"></td>
      <td data-date="2020-01-01" data-count="0" aria-label="No contributions on Jan 1, 2020"></td>
      <td data-date="2020-01-02" data-count="1" aria-label="1 contribution on Jan 2, 2020"></td>
    `;

    expect(parseContributionCalendarHtml(html)).toEqual([
      { date: '2020-01-02', count: 1 },
      { date: '2020-01-03', count: 2 },
    ]);
  });

  it('falls back to singular, plural, and no-contribution aria-label counts', () => {
    const html = `
      <td data-date="2020-02-01" aria-label="1 contribution on Feb 1, 2020"></td>
      <td data-date="2020-02-02" aria-label="12 contributions on Feb 2, 2020"></td>
      <td data-date="2020-02-03" aria-label="No contributions on Feb 3, 2020"></td>
    `;

    expect(parseContributionCalendarHtml(html)).toEqual([
      { date: '2020-02-01', count: 1 },
      { date: '2020-02-02', count: 12 },
    ]);
  });

  it('reads current GitHub tool-tip labels keyed by contribution cell id', () => {
    const html = `
      <td data-date="2025-07-06" id="contribution-day-component-0-0"></td>
      <tool-tip for="contribution-day-component-0-0">7 contributions on July 6th.</tool-tip>
      <td data-date="2025-07-07" id="contribution-day-component-0-1"></td>
      <tool-tip for="contribution-day-component-0-1">No contributions on July 7th.</tool-tip>
    `;

    expect(parseContributionCalendarHtml(html)).toEqual([{ date: '2025-07-06', count: 7 }]);
  });
});

describe('fetchContributionCalendar', () => {
  it('follows contribution year links and de-duplicates overlapping days', async () => {
    const transport = new FakeTransport([
      htmlResponse(`
        <td data-date="2024-01-01" data-count="1"></td>
        <a href="/users/octocat/contributions?from=2023-12-01&amp;to=2023-12-31">2023</a>
        <a href="/users/octocat/contributions?from=2022-12-01&amp;to=2022-12-31">2022</a>
      `),
      htmlResponse(`
        <td data-date="2023-01-01" data-count="2"></td>
        <td data-date="2024-01-01" data-count="1"></td>
      `),
      htmlResponse('<td data-date="2022-01-01" data-count="3"></td>'),
    ]);

    await expect(fetchContributionCalendar({ lookup: 'octocat' }, { transport })).resolves.toEqual([
      { date: '2022-01-01', count: 3 },
      { date: '2023-01-01', count: 2 },
      { date: '2024-01-01', count: 1 },
    ]);
    expect(transport.requestedUrls).toEqual([
      'https://github.com/users/octocat/contributions',
      'https://github.com/users/octocat/contributions?from=2023-12-01&to=2023-12-31',
      'https://github.com/users/octocat/contributions?from=2022-12-01&to=2022-12-31',
    ]);
  });
});
