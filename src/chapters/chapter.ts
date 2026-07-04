export type OriginChapter = { kind: 'origin'; date: string | null };

export type DarkAgeChapter = {
  kind: 'dark-age';
  /** Silence start: day after the last contribution before the gap. */
  date: string;
  /** Day before the return contribution; null = ongoing at capture. */
  endDate: string | null;
  /** Days strictly inside the gap. */
  lengthDays: number;
};

export type GreatStreakChapter = {
  kind: 'great-streak';
  date: string;
  endDate: string;
  lengthDays: number;
};

export type ProlificacyChapter = {
  kind: 'prolificacy';
  /** Y-01-01. */
  date: string;
  year: number;
  contributionCount: number;
  priorYearContributionCount: number;
};

export type FlagshipRiseChapter = {
  kind: 'flagship-rise';
  /** Degraded dating: the repo's createdDate (star-event timestamps unfetchable logged-out). */
  date: string;
  repoName: string;
  starCount: number;
};

export type StarMilestoneChapter = {
  kind: 'star-milestone';
  /** createdDate of the repo whose addition crossed the threshold. */
  date: string;
  threshold: 100 | 1000 | 10000;
};

export type LanguageEraChapter = {
  kind: 'language-era';
  /** Y-01-01. */
  date: string;
  year: number;
  fromLanguage: string;
  toLanguage: string;
};

/** Discriminated union; the three repository kinds join in this phase's wiring commit. */
export type Chapter = OriginChapter | DarkAgeChapter | GreatStreakChapter | ProlificacyChapter;
