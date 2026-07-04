import { describe, expect, it } from 'vitest';

import { narrateChapter } from './narrate-chapter.js';

describe('narrateChapter', () => {
  it('narrates a dated origin with the year as a numeral', () => {
    expect(narrateChapter({ kind: 'origin', date: '2019-03-20' })).toBe(
      'In the year 2019, the developer first set foot upon the public forge, and the epic began.',
    );
  });

  it('narrates an undated origin with the grace-floor line', () => {
    expect(narrateChapter({ kind: 'origin', date: null })).toBe(
      'The chronicle is yet unwritten, and the epic has just begun.',
    );
  });
});
