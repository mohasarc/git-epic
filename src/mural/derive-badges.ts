import type { StrengthsResult } from '../strengths/score-strengths.js';
import type { StrengthDimension } from '../strengths/strength-dimensions.js';
import type { Badge } from './mural-scene.js';

const MAX_BADGES = 4;

/** Dominant-language share at or above which the account earns a specialist badge. */
const SPECIALIST_REPO_SHARE = 0.5;

const GENERIC_BADGE_LABEL = 'The Journey Begins';

const DIMENSION_TITLES: Record<StrengthDimension, string> = {
  projectCount: 'Prolific Builder',
  stars: 'Star Magnet',
  forks: 'Widely Forked',
  followers: 'Followed',
  pullRequests: 'Heavy PR Contributor',
  issues: 'Diligent Reporter',
  languageBreadth: 'Polyglot Explorer',
  activityVolume: 'Relentless',
};

export function deriveBadges(strengths: StrengthsResult): Badge[] {
  const top = strengths.ranked[0];
  if (!top || top.tier === 0) return [{ label: GENERIC_BADGE_LABEL }];

  const badges: Badge[] = [];

  const { dominantLanguage } = strengths;
  if (dominantLanguage && dominantLanguage.repoShare >= SPECIALIST_REPO_SHARE) {
    badges.push({ label: `${dominantLanguage.name} Specialist` });
  }

  for (const [index, score] of strengths.ranked.entries()) {
    if (badges.length >= MAX_BADGES) break;
    if (index === 0 || score.tier >= 1) badges.push({ label: DIMENSION_TITLES[score.dimension] });
  }

  return badges;
}
