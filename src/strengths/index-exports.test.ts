import { describe, expect, it } from 'vitest';

import * as publicApi from '../index.js';

describe('public API strengths exports', () => {
  it('exports scoreStrengths', () => {
    expect(typeof publicApi.scoreStrengths).toBe('function');
  });
});
