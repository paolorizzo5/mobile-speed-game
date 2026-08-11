export type ShapeType = 'circle' | 'square' | 'triangle' | 'diamond';

export interface GameColor {
  name: string;
  value: string;
}

export const SHAPES: ShapeType[] = ['circle', 'square', 'triangle', 'diamond'];

export const COLORS: GameColor[] = [
  { name: 'rosso', value: '#EF4444' },
  { name: 'blu', value: '#3B82F6' },
  { name: 'verde', value: '#22C55E' },
  { name: 'giallo', value: '#F59E0B' },
  { name: 'viola', value: '#A855F7' },
  { name: 'ciano', value: '#06B6D4' },
];

export interface GameItem {
  id: string;
  shape: ShapeType;
  color: GameColor;
}

export interface RoundResult {
  roundId: 1 | 2 | 3;
  label: string;
  hits: number;
  misses: number;
  timeouts: number;
  avgReactionMs: number;
  score: number;
}

export interface Player {
  level: number;
  xp: number;
  gamesPlayed: number;
  bestScore: number;
}

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 20;

export function randomItem<T>(arr: T[], random: () => number = Math.random): T {
  return arr[Math.floor(random() * arr.length)];
}

export function shuffle<T>(arr: T[], random: () => number = Math.random): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
