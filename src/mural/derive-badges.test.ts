import { describe, expect, it } from 'vitest';

import { scoreStrengths } from '../strengths/score-strengths.js';
import { buildHistorySnapshot } from '../test-support/build-history-snapshot.js';
import { loadHistorySnapshotFixture } from '../test-support/load-history-snapshot-fixture.js';
import { deriveBadges } from './derive-badges.js';

function badgesFor(fixtureFileName: string): string[] {
  const strengths = scoreStrengths(loadHistorySnapshotFixture(fixtureFileName));
  return deriveBadges(strengths).map((badge) => badge.label);
}

describe('deriveBadges', () => {
  it('gives rich-history up to four tier-1+ titled badges led by its specialist', () => {
    const labels = badgesFor('rich-history-account.json');

    expect(labels).toEqual([
      'JavaScript Specialist',
      'Heavy PR Contributor',
      'Followed',
      'Star Magnet',
    ]);
  });

  it('leads star-heavy with its dominant-language specialist badge', () => {
    const labels = badgesFor('star-heavy-account.json');

    expect(labels[0]).toBe('TypeScript Specialist');
    expect(labels).toContain('Star Magnet');
    expect(labels.length).toBeLessThanOrEqual(4);
  });

  it('titles polyglot Polyglot Explorer without a specialist badge', () => {
    const labels = badgesFor('polyglot-account.json');

    expect(labels).toContain('Polyglot Explorer');
    expect(labels.every((label) => !label.endsWith('Specialist'))).toBe(true);
  });

  it('names pr-heavy a Heavy PR Contributor', () => {
    const labels = badgesFor('pr-heavy-account.json');

    expect(labels).toContain('Heavy PR Contributor');
  });

  it('gives modest only its real strengths, floored at one and never a tier-0 title', () => {
    const labels = badgesFor('modest-account.json');

    expect(labels.length).toBeGreaterThanOrEqual(1);
    expect(labels.length).toBeLessThanOrEqual(4);
    expect(labels).not.toContain('Diligent Reporter');
  });

  it('gives zero-activity accounts exactly the generic journey badge', () => {
    for (const fixtureFileName of ['brand-new-account.json', 'single-contribution-account.json']) {
      const strengths = scoreStrengths(loadHistorySnapshotFixture(fixtureFileName));

      expect(deriveBadges(strengths)).toEqual([{ label: 'The Journey Begins' }]);
    }
  });

  it('emits the specialist badge at a dominant repoShare of exactly 0.5', () => {
    const snapshot = buildHistorySnapshot({
      repositories: [
        {
          name: 'flagship',
          createdDate: '2020-01-01',
          lastPushedDate: '2021-01-01',
          starCount: 400,
          forkCount: 0,
          isFork: false,
          primaryLanguage: 'TypeScript',
        },
        {
          name: 'sidecar',
          createdDate: '2020-06-01',
          lastPushedDate: '2021-06-01',
          starCount: 400,
          forkCount: 0,
          isFork: false,
          primaryLanguage: 'Python',
        },
      ],
    });
    const strengths = scoreStrengths(snapshot);

    expect(strengths.dominantLanguage?.repoShare).toBe(0.5);
    expect(strengths.ranked[0].tier).toBeGreaterThanOrEqual(1);
    expect(deriveBadges(strengths)[0].label).toMatch(/ Specialist$/);
  });
});
