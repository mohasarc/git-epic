import type { HistorySnapshot } from '../history-snapshot.js';

export function stableHistorySnapshotJson(snapshot: HistorySnapshot): string {
  return `${JSON.stringify(stableHistorySnapshot(snapshot), null, 2)}\n`;
}

function stableHistorySnapshot(snapshot: HistorySnapshot): HistorySnapshot {
  return {
    handle: snapshot.handle,
    accountCreatedDate: snapshot.accountCreatedDate,
    firstPublicActivityDate: snapshot.firstPublicActivityDate,
    capturedAtDate: snapshot.capturedAtDate,
    contributionDays: snapshot.contributionDays.map((contributionDay) => ({
      date: contributionDay.date,
      count: contributionDay.count,
    })),
    followerCount: snapshot.followerCount,
    repositories: snapshot.repositories.map((repository) => ({
      name: repository.name,
      createdDate: repository.createdDate,
      lastPushedDate: repository.lastPushedDate,
      starCount: repository.starCount,
      forkCount: repository.forkCount,
      isFork: repository.isFork,
      primaryLanguage: repository.primaryLanguage,
    })),
  };
}
