import { RoundResult, MAX_LEVEL, MIN_LEVEL } from './types';

export const LEVEL_UP_THRESHOLD = 75;
export const LEVEL_DOWN_THRESHOLD = 40;

export type LevelChange = 'up' | 'down' | 'same';

export function computeOverallScore(results: RoundResult[]): number {
  if (results.length === 0) return 0;
  return Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
}

export function computeNextLevel(currentLevel: number, overallScore: number): { level: number; change: LevelChange } {
  if (overallScore >= LEVEL_UP_THRESHOLD) {
    return { level: Math.min(MAX_LEVEL, currentLevel + 1), change: currentLevel >= MAX_LEVEL ? 'same' : 'up' };
  }
  if (overallScore < LEVEL_DOWN_THRESHOLD) {
    return { level: Math.max(MIN_LEVEL, currentLevel - 1), change: currentLevel <= MIN_LEVEL ? 'same' : 'down' };
  }
  return { level: currentLevel, change: 'same' };
}
