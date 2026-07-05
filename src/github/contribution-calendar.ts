import type { ContributionDay } from '../history-snapshot.js';

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
