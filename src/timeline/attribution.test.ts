import { describe, expect, it } from 'vitest';

import { CREDIT_LINE, epicOfLine } from './attribution.js';

describe('attribution', () => {
  it('formats the epic-of line with the handle', () => {
    expect(epicOfLine('first-spark')).toBe('The Epic of first-spark');
  });

  it('pins the credit line', () => {
    expect(CREDIT_LINE).toBe('✦ forge yours at git-epic.dev');
  });
});
