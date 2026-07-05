import { describe, expect, it } from 'vitest';
import type { Chapter } from '../chapters/chapter.js';
import { CHAPTER_TYPE_PRECEDENCE } from '../chapters/chapter.js';
import type { StrengthsResult } from '../strengths/score-strengths.js';
import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { buildRepositorySummary } from '../test-support/build-repository-summary.js';
import type { NarratedChapter } from '../timeline/build-timeline.js';
import {
  PRESENT_DAY_LABEL,
  accessibleDescription,
  eraTitle,
  stripSubtitle,
} from './mural-text.js';

const NO_STRENGTHS: StrengthsResult = {
  ranked: [],
  topDimension: undefined as unknown as StrengthsResult['topDimension'],
  unavailable: [],
  dominantLanguage: null,
};

describe('eraTitle', () => {
  it('returns an all-caps title for every chapter kind and the present-day stretch', () => {
    for (const kind of CHAPTER_TYPE_PRECEDENCE) {
      const title = eraTitle({ kind } as unknown as Chapter);
      expect(title).toBe(title.toUpperCase());
      expect(title.length).toBeGreaterThan(0);
    }
    const presentDay = eraTitle(null);
    expect(presentDay).toBe(presentDay.toUpperCase());
    expect(presentDay.length).toBeGreaterThan(0);
  });
});

describe('stripSubtitle', () => {
  it('uses the dominant language as the real fact when available', () => {
    const strengths: StrengthsResult = { ...NO_STRENGTHS, dominantLanguage: { name: 'Rust', repoShare: 0.8 } };
    const subtitle = stripSubtitle(buildHistorySnapshot({ handle: 'ada' }), strengths);
    expect(subtitle).toContain('ada');
    expect(subtitle).toContain('Rust');
  });

  it('falls back to a real repo name when no dominant language', () => {
    const snapshot = buildHistorySnapshot({
      handle: 'ada',
      repositories: [buildRepositorySummary({ name: 'atlas', primaryLanguage: null })],
    });
    const subtitle = stripSubtitle(snapshot, NO_STRENGTHS);
    expect(subtitle).toContain('atlas');
  });

  it('falls back to a generic origin-year subtitle when data is bare', () => {
    const snapshot = buildHistorySnapshot({ handle: 'ada', accountCreatedDate: '2015-06-01', repositories: [] });
    const subtitle = stripSubtitle(snapshot, NO_STRENGTHS);
    expect(subtitle).toContain('ada');
    expect(subtitle).toContain('2015');
  });

  it('carries an XML-hostile handle verbatim (escaping is the render layer job)', () => {
    const handle = '<b>&"x';
    const subtitle = stripSubtitle(buildHistorySnapshot({ handle }), NO_STRENGTHS);
    expect(subtitle).toContain(handle);
  });
});

describe('accessibleDescription', () => {
  it('joins the narration prose', () => {
    const chapters: NarratedChapter[] = [
      { chapter: { kind: 'origin', date: '2020-01-01' }, narration: 'First line.' },
      { chapter: { kind: 'great-streak', date: '2021-01-01', endDate: '2021-02-01', lengthDays: 31 }, narration: 'Second line.' },
    ];
    expect(accessibleDescription(chapters)).toBe('First line. Second line.');
  });

  it('never renders empty for a chapterless account', () => {
    expect(accessibleDescription([]).length).toBeGreaterThan(0);
  });
});

describe('present-day label', () => {
  it('is a non-empty all-caps constant', () => {
    expect(PRESENT_DAY_LABEL).toBe(PRESENT_DAY_LABEL.toUpperCase());
    expect(PRESENT_DAY_LABEL.length).toBeGreaterThan(0);
  });
});
