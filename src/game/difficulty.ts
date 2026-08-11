import { MAX_LEVEL, MIN_LEVEL } from './types';

function progress(level: number): number {
  const clamped = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level));
  return (clamped - MIN_LEVEL) / (MAX_LEVEL - MIN_LEVEL);
}

function lerp(level: number, from: number, to: number): number {
  return from + (to - from) * progress(level);
}

export interface TargetsDifficulty {
  durationMs: number;
  spawnIntervalMs: number;
  targetLifespanMs: number;
  targetSize: number;
}

export function getTargetsDifficulty(level: number): TargetsDifficulty {
  return {
    durationMs: 25000,
    spawnIntervalMs: lerp(level, 1300, 480),
    targetLifespanMs: lerp(level, 1600, 700),
    targetSize: lerp(level, 76, 46),
  };
}

export interface MatchDifficulty {
  totalChallenges: number;
  optionCount: number;
  timePerChallengeMs: number;
  similarDecoyChance: number;
}

export function getMatchDifficulty(level: number): MatchDifficulty {
  return {
    totalChallenges: 10,
    optionCount: Math.round(lerp(level, 4, 12)),
    timePerChallengeMs: lerp(level, 3400, 1400),
    similarDecoyChance: lerp(level, 0.35, 0.85),
  };
}

export interface ScrollDifficulty {
  durationMs: number;
  spawnIntervalMs: number;
  speedPxPerSec: number;
  laneCount: number;
  matchChance: number;
}

export function getScrollDifficulty(level: number): ScrollDifficulty {
  return {
    durationMs: 25000,
    spawnIntervalMs: lerp(level, 1100, 480),
    speedPxPerSec: lerp(level, 90, 260),
    laneCount: Math.round(lerp(level, 3, 5)),
    matchChance: 0.4,
  };
}
