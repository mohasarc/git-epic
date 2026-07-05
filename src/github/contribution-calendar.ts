import type { ContributionDay } from '../history-snapshot.js';
import type { ParsedGitHubHandle } from './github-handle.js';
import type { HttpTransport } from './http-transport.js';

export type ContributionCalendarFetchOptions = {
  transport: HttpTransport;
};

export async function fetchContributionCalendar(
  handle: ParsedGitHubHandle,
  options: ContributionCalendarFetchOptions,
): Promise<ContributionDay[]> {
  const profileUrl = `https://github.com/${handle.lookup}`;
  const profileResponse = await options.transport.get(profileUrl);
  const contributionDaysByDate = new Map<string, ContributionDay>();

  addContributionDays(contributionDaysByDate, parseContributionCalendarHtml(profileResponse.body));

  for (const contributionUrl of parseContributionYearUrls(profileResponse.body)) {
    const contributionResponse = await options.transport.get(contributionUrl);
    addContributionDays(contributionDaysByDate, parseContributionCalendarHtml(contributionResponse.body));
  }

  return [...contributionDaysByDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export function parseContributionCalendarHtml(html: string): ContributionDay[] {
  const contributionDays: ContributionDay[] = [];
  const contributionElementPattern = /<[^>]*\bdata-date="(?<date>\d{4}-\d{2}-\d{2})"[^>]*>/g;

  for (const match of html.matchAll(contributionElementPattern)) {
    const element = match[0];
    const date = match.groups?.date;
    if (!date) {
      continue;
    }

    const count = parseContributionCount(element);
    if (count > 0) {
      contributionDays.push({ date, count });
    }
  }

  return contributionDays.sort((left, right) => left.date.localeCompare(right.date));
}

function parseContributionCount(element: string): number {
  const dataCountMatch = element.match(/\bdata-count="(?<count>\d+)"/);
  if (dataCountMatch?.groups?.count) {
    return Number(dataCountMatch.groups.count);
  }

  const ariaLabelMatch = element.match(/\baria-label="(?<label>[^"]+)"/);
  const ariaLabel = ariaLabelMatch?.groups?.label;
  if (!ariaLabel || ariaLabel.startsWith('No contributions')) {
    return 0;
  }

  const countMatch = ariaLabel.match(/^(?<count>\d+) contributions?/);
  return countMatch?.groups?.count ? Number(countMatch.groups.count) : 0;
}

function addContributionDays(target: Map<string, ContributionDay>, contributionDays: ContributionDay[]): void {
  for (const contributionDay of contributionDays) {
    const existing = target.get(contributionDay.date);
    if (!existing || contributionDay.count > existing.count) {
      target.set(contributionDay.date, contributionDay);
    }
  }
}

function parseContributionYearUrls(html: string): string[] {
  const urls: string[] = [];
  const hrefPattern = /\bhref="(?<href>\/users\/[^"]+\/contributions\?[^"]+)"/g;

  for (const match of html.matchAll(hrefPattern)) {
    const href = match.groups?.href;
    if (href) {
      urls.push(`https://github.com${decodeHtmlAttribute(href)}`);
    }
  }

  return urls;
}

function decodeHtmlAttribute(value: string): string {
  return value.replaceAll('&amp;', '&');
}
