import { describe, expect, it } from 'vitest';
import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import type { NarratedChapter } from '../timeline/build-timeline.js';
import { deriveTier } from './derive-tier.js';
import { partitionEras } from './partition-eras.js';

const SPAN_START = '2020-01-01';
const SPAN_END = '2026-01-01';

describe('deriveTier', () => {
  it('assigns the span start to the earliest third', () => {
    expect(deriveTier(SPAN_START, SPAN_START, SPAN_END)).toBe('ancient');
  });

  it('assigns a first-third date to ancient', () => {
    expect(deriveTier('2020-06-01', SPAN_START, SPAN_END)).toBe('ancient');
  });

  it('assigns a middle-third date to classical', () => {
    expect(deriveTier('2023-01-01', SPAN_START, SPAN_END)).toBe('classical');
  });

  it('assigns a last-third date to modern', () => {
    expect(deriveTier('2025-06-01', SPAN_START, SPAN_END)).toBe('modern');
  });
});

describe('era tiers from partitionEras', () => {
  const snapshot = buildHistorySnapshot({
    firstPublicActivityDate: SPAN_START,
    capturedAtDate: SPAN_END,
  });

  it('makes the earliest era ancient and the present-day era modern', () => {
    const chapters: NarratedChapter[] = [
      { chapter: { kind: 'origin', date: SPAN_START }, narration: '' },
      { chapter: { kind: 'flagship-rise', date: '2024-06-01', repoName: 'atlas', starCount: 500 }, narration: '' },
    ];
    const eras = partitionEras(snapshot, chapters);
    expect(eras[0].tier).toBe('ancient');
    expect(eras[eras.length - 1].tier).toBe('modern');
  });

  it('skips classical for a short two-era history', () => {
    const chapters: NarratedChapter[] = [{ chapter: { kind: 'origin', date: SPAN_START }, narration: '' }];
    const eras = partitionEras(snapshot, chapters);
    expect(eras).toHaveLength(2);
    expect(eras.map((era) => era.tier)).not.toContain('classical');
  });
});
