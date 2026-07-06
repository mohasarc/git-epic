import type { StrengthScore, StrengthsResult } from './score-strengths.js';

export function stableStrengthsJson(result: StrengthsResult): string {
  return `${JSON.stringify(stableStrengths(result), null, 2)}\n`;
}

function stableStrengths(result: StrengthsResult) {
  return {
    ranked: result.ranked.map(stableScore),
    topDimension: stableScore(result.topDimension),
    unavailable: [...result.unavailable],
    dominantLanguage: result.dominantLanguage
      ? { name: result.dominantLanguage.name, repoShare: result.dominantLanguage.repoShare }
      : null,
  };
}

function stableScore(score: StrengthScore) {
  return {
    dimension: score.dimension,
    rawValue: score.rawValue,
    tier: score.tier,
    reach: score.reach,
  };
}
