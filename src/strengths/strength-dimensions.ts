export type StrengthDimension =
  | 'projectCount'
  | 'stars'
  | 'forks'
  | 'followers'
  | 'pullRequests'
  | 'issues'
  | 'languageBreadth'
  | 'activityVolume';

export const STRENGTH_DIMENSIONS: readonly StrengthDimension[] = [
  'projectCount',
  'stars',
  'forks',
  'followers',
  'pullRequests',
  'issues',
  'languageBreadth',
  'activityVolume',
];

/**
 * Priority when two dimensions tie on reach. Harder-to-fake authored signal
 * (stars, own projects, language breadth) ranks ahead of the softer dimensions.
 */
export const RANKING_TIE_BREAK_ORDER: readonly StrengthDimension[] = [
  'stars',
  'projectCount',
  'languageBreadth',
  'forks',
  'followers',
  'pullRequests',
  'issues',
  'activityVolume',
];
