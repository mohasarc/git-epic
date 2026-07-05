import type { HistorySnapshot, RepositorySummary } from '../history-snapshot.js';
import {
  RANKING_TIE_BREAK_ORDER,
  STRENGTH_DIMENSIONS,
  type StrengthDimension,
} from './strength-dimensions.js';
import { DIMENSION_TIER_THRESHOLDS, type TierThresholds } from './tier-thresholds.js';

export type StrengthScore = {
  dimension: StrengthDimension;
  rawValue: number;
  tier: 0 | 1 | 2 | 3 | 4;
  reach: number;
};

export type DominantLanguage = { name: string; repoShare: number };

export type StrengthsResult = {
  ranked: StrengthScore[];
  topDimension: StrengthScore;
  unavailable: StrengthDimension[];
  dominantLanguage: DominantLanguage | null;
};

const BAND_KNOTS = [0, 0.25, 0.5, 0.75, 1] as const;

export function scoreStrengths(snapshot: HistorySnapshot): StrengthsResult {
  const rawValues = rawDimensionValues(snapshot);

  const unavailable = STRENGTH_DIMENSIONS.filter((dimension) => rawValues[dimension] === null);
  const ranked = STRENGTH_DIMENSIONS.filter((dimension) => rawValues[dimension] !== null)
    .map((dimension) => scoreDimension(dimension, rawValues[dimension] as number))
    .sort(byReachThenTieBreak);

  return {
    ranked,
    topDimension: ranked[0],
    unavailable,
    dominantLanguage: deriveDominantLanguage(snapshot.repositories),
  };
}

function rawDimensionValues(snapshot: HistorySnapshot): Record<StrengthDimension, number | null> {
  const repos = snapshot.repositories;
  const nonForkRepos = repos.filter((repo) => !repo.isFork);

  return {
    projectCount: nonForkRepos.length,
    stars: sumBy(repos, (repo) => repo.starCount),
    forks: sumBy(repos, (repo) => repo.forkCount),
    followers: snapshot.followerCount,
    pullRequests: snapshot.pullRequestsOpenedCount,
    issues: snapshot.issuesOpenedCount,
    languageBreadth: distinctLanguages(nonForkRepos).size,
    activityVolume: sumBy(snapshot.contributionDays, (day) => day.count),
  };
}

function scoreDimension(dimension: StrengthDimension, rawValue: number): StrengthScore {
  const reach = reachFor(rawValue, DIMENSION_TIER_THRESHOLDS[dimension]);
  return { dimension, rawValue, reach, tier: tierFor(reach) };
}

function reachFor(rawValue: number, thresholds: TierThresholds): number {
  if (rawValue <= 0) return 0;
  if (rawValue >= thresholds[3]) return 1;

  const lowerKnot = [0, ...thresholds];
  for (let band = 0; band < thresholds.length; band++) {
    const bandStart = lowerKnot[band];
    const bandEnd = lowerKnot[band + 1];
    if (rawValue <= bandEnd) {
      const fraction = (rawValue - bandStart) / (bandEnd - bandStart);
      return BAND_KNOTS[band] + fraction * (BAND_KNOTS[band + 1] - BAND_KNOTS[band]);
    }
  }
  return 1;
}

function tierFor(reach: number): 0 | 1 | 2 | 3 | 4 {
  return Math.min(4, Math.floor(reach * 4)) as 0 | 1 | 2 | 3 | 4;
}

function byReachThenTieBreak(a: StrengthScore, b: StrengthScore): number {
  if (b.reach !== a.reach) return b.reach - a.reach;
  return RANKING_TIE_BREAK_ORDER.indexOf(a.dimension) - RANKING_TIE_BREAK_ORDER.indexOf(b.dimension);
}

function deriveDominantLanguage(repositories: RepositorySummary[]): DominantLanguage | null {
  const languageRepos = repositories.filter(
    (repo) => !repo.isFork && repo.primaryLanguage !== null,
  );
  if (languageRepos.length === 0) return null;

  const byLanguage = new Map<string, { count: number; maxStars: number }>();
  for (const repo of languageRepos) {
    const language = repo.primaryLanguage as string;
    const existing = byLanguage.get(language);
    if (existing) {
      existing.count += 1;
      existing.maxStars = Math.max(existing.maxStars, repo.starCount);
    } else {
      byLanguage.set(language, { count: 1, maxStars: repo.starCount });
    }
  }

  const [name, stats] = [...byLanguage.entries()].sort(([nameA, a], [nameB, b]) => {
    if (b.count !== a.count) return b.count - a.count;
    if (b.maxStars !== a.maxStars) return b.maxStars - a.maxStars;
    return nameA.localeCompare(nameB);
  })[0];

  return { name, repoShare: stats.count / languageRepos.length };
}

function distinctLanguages(repositories: RepositorySummary[]): Set<string> {
  const languages = new Set<string>();
  for (const repo of repositories) {
    if (repo.primaryLanguage !== null) languages.add(repo.primaryLanguage);
  }
  return languages;
}

function sumBy<T>(items: T[], value: (item: T) => number): number {
  return items.reduce((total, item) => total + value(item), 0);
}
