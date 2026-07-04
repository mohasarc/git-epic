/** Dates are date-only ISO strings (YYYY-MM-DD), UTC. */
export type HistorySnapshot = {
  /** GitHub login, canonical casing (canonicalization is the Stage 4 fetch layer's job). */
  handle: string;
  accountCreatedDate: string;
  /** null for an account with zero public activity. No ordering guarantee vs accountCreatedDate. */
  firstPublicActivityDate: string | null;
  /** The "now" the present-day card marks. In the snapshot so rendering stays pure. */
  capturedAtDate: string;
};
