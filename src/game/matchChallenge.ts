import { COLORS, SHAPES, GameItem, ShapeType, GameColor, randomItem, shuffle } from './types';
import { MatchDifficulty } from './difficulty';
import { Rng } from './rng';

export interface MatchChallenge {
  reference: GameItem;
  options: GameItem[];
  correctId: string;
}

function comboKey(shape: ShapeType, color: GameColor): string {
  return `${shape}-${color.name}`;
}

export function generateMatchChallenge(difficulty: MatchDifficulty, random: Rng = Math.random): MatchChallenge {
  const reference: GameItem = {
    id: 'reference',
    shape: randomItem(SHAPES, random),
    color: randomItem(COLORS, random),
  };
  const used = new Set([comboKey(reference.shape, reference.color)]);
  const decoys: GameItem[] = [];
  let attempts = 0;
  const neededDecoys = Math.max(1, difficulty.optionCount - 1);

  while (decoys.length < neededDecoys && attempts < 300) {
    attempts += 1;
    let shape: ShapeType;
    let color: GameColor;
    if (random() < difficulty.similarDecoyChance) {
      if (random() < 0.5) {
        shape = reference.shape;
        color = randomItem(COLORS.filter((c) => c.name !== reference.color.name), random);
      } else {
        color = reference.color;
        shape = randomItem(SHAPES.filter((s) => s !== reference.shape), random);
      }
    } else {
      shape = randomItem(SHAPES.filter((s) => s !== reference.shape), random);
      color = randomItem(COLORS.filter((c) => c.name !== reference.color.name), random);
    }
    const key = comboKey(shape, color);
    if (used.has(key)) continue;
    used.add(key);
    decoys.push({ id: `decoy-${decoys.length}-${attempts}`, shape, color });
  }

  const correctOption: GameItem = {
    id: 'correct',
    shape: reference.shape,
    color: reference.color,
  };

  const options = shuffle([correctOption, ...decoys], random);
  return { reference, options, correctId: correctOption.id };
}
