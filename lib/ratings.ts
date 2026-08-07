/** Crew ratings are stored and shown on a 1–5 star scale. */
export const RATING_MAX = 5;

/**
 * Normalize a stored score to 1–5.
 * Legacy ratings used 1–10; map those onto the five-star scale.
 */
export function toFiveStarScale(score: number): number {
  if (!Number.isFinite(score) || score <= 0) return 0;
  if (score > RATING_MAX) {
    return Math.min(RATING_MAX, Math.round((score / 10) * RATING_MAX));
  }
  return score;
}

export function averageFiveStarScores(scores: number[]): number | undefined {
  if (scores.length === 0) return undefined;
  const total = scores.reduce((sum, s) => sum + toFiveStarScale(s), 0);
  return total / scores.length;
}
