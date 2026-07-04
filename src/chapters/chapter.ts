export type OriginChapter = { kind: 'origin'; date: string | null };

/** Discriminated union; six more chapter kinds arrive in Stage 2. */
export type Chapter = OriginChapter;
