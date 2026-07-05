import type { HistorySnapshot } from '../history-snapshot.js';
import { fetchContributionCalendar } from './contribution-calendar.js';
import { defaultHttpTransport } from './default-http-transport.js';
import type { FetchGitHubSnapshotResult } from './fetch-github-snapshot-result.js';
import { fetchGitHubPublicProfile } from './github-rest-client.js';
import { parseGitHubHandleInput } from './github-handle.js';
import type { HttpTransport } from './http-transport.js';

export type FetchGitHubSnapshotOptions = {
  transport?: HttpTransport;
  capturedAtDate?: string;
};

export async function fetchGitHubSnapshot(
  handleInput: string,
  options?: FetchGitHubSnapshotOptions,
): Promise<FetchGitHubSnapshotResult> {
  const parsedHandle = parseGitHubHandleInput(handleInput);
  if (parsedHandle.kind === 'invalid') {
    return { kind: 'not-found', handle: handleInput.trim() };
  }

  const transport = options?.transport ?? defaultHttpTransport;
  const profileResult = await fetchGitHubPublicProfile(parsedHandle.handle, { transport });
  if (profileResult.kind !== 'success') {
    return profileResult;
  }

  const contributionDays = await fetchContributionCalendar(parsedHandle.handle, { transport });
  const snapshot: HistorySnapshot = {
    handle: profileResult.profile.login,
    accountCreatedDate: profileResult.profile.accountCreatedDate,
    firstPublicActivityDate: firstPublicActivityDate(
      contributionDays.map((contributionDay) => contributionDay.date),
      profileResult.profile.repositories.map((repository) => repository.createdDate),
    ),
    capturedAtDate: options?.capturedAtDate ?? todayUtcDate(),
    contributionDays,
    repositories: profileResult.profile.repositories,
  };

  return { kind: 'success', snapshot };
}

function firstPublicActivityDate(contributionDates: string[], repositoryCreatedDates: string[]): string | null {
  const dates = [...contributionDates, ...repositoryCreatedDates].sort();
  return dates[0] ?? null;
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}
