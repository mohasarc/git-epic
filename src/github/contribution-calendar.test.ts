import { describe, expect, it } from 'vitest';
import { parseContributionCalendarHtml } from './contribution-calendar.js';

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
});
