/** Dates are date-only ISO strings (YYYY-MM-DD), UTC. */
export type ContributionDay = { date: string; count: number };

export type RepositorySummary = {
  name: string;
  createdDate: string;
  /** null = never pushed (empty repo). */
  lastPushedDate: string | null;
  starCount: number;
  /** Inbound forks of this repo (forks_count). */
  forkCount: number;
  /** This repo is itself a fork of another. */
  isFork: boolean;
  primaryLanguage: string | null;
};

export type HistorySnapshot = {
  /** GitHub login, canonical casing (canonicalization is the Stage 4 fetch layer's job). */
  handle: string;
  accountCreatedDate: string;
  /**
   * null for an account with zero public activity — implies contributionDays and
   * repositories are empty (a public repo is public activity). Fetch layer contract.
   * No ordering guarantee vs accountCreatedDate.
   */
  firstPublicActivityDate: string | null;
  /** The "now" the present-day card marks. In the snapshot so rendering stays pure. */
  capturedAtDate: string;
  /** Days with ≥1 public contribution only, ascending by date. */
  contributionDays: ContributionDay[];
  followerCount: number;
  /** Public repos, ascending by createdDate. */
  repositories: RepositorySummary[];
  /** Opened PRs, search-derived. null = search unavailable (dimension goes quiet); 0 = genuine zero. */
  pullRequestsOpenedCount: number | null;
  /** Opened issues, search-derived. null = search unavailable; 0 = genuine zero. */
  issuesOpenedCount: number | null;
};
