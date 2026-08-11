export function computeRoundScore(
  hits: number,
  misses: number,
  timeouts: number,
  avgReactionMs: number,
  maxReactionMs: number = 1500
): number {
  const attempts = hits + misses + timeouts;
  if (attempts === 0) return 0;
  const accuracy = hits / attempts;
  const reactionFactor = avgReactionMs > 0 ? Math.max(0, 1 - avgReactionMs / maxReactionMs) : 0.5;
  const score = accuracy * 70 + reactionFactor * 30;
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}
