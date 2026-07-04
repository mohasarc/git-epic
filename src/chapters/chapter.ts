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

/** Discriminated union; five more chapter kinds arrive across Stage 2. */
export type Chapter = OriginChapter;
