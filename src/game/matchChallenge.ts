import { COLORS, SHAPES, GameItem, ShapeType, GameColor, randomItem, shuffle } from './types';
import { MatchDifficulty } from './difficulty';

export interface MatchChallenge {
  reference: GameItem;
  options: GameItem[];
  correctId: string;
}

function comboKey(shape: ShapeType, color: GameColor): string {
  return `${shape}-${color.name}`;
}

export function generateMatchChallenge(difficulty: MatchDifficulty): MatchChallenge {
  const reference: GameItem = {
    id: 'reference',
    shape: randomItem(SHAPES),
    color: randomItem(COLORS),
  };
  const used = new Set([comboKey(reference.shape, reference.color)]);
  const decoys: GameItem[] = [];
  let attempts = 0;
  const neededDecoys = Math.max(1, difficulty.optionCount - 1);

  while (decoys.length < neededDecoys && attempts < 300) {
    attempts += 1;
    let shape: ShapeType;
    let color: GameColor;
    if (Math.random() < difficulty.similarDecoyChance) {
      if (Math.random() < 0.5) {
        shape = reference.shape;
        color = randomItem(COLORS.filter((c) => c.name !== reference.color.name));
      } else {
        color = reference.color;
        shape = randomItem(SHAPES.filter((s) => s !== reference.shape));
      }
    } else {
      shape = randomItem(SHAPES.filter((s) => s !== reference.shape));
      color = randomItem(COLORS.filter((c) => c.name !== reference.color.name));
    }
    const key = comboKey(shape, color);
    if (used.has(key)) continue;
    used.add(key);
    decoys.push({ id: `decoy-${Date.now()}-${Math.random()}`, shape, color });
  }

  const correctOption: GameItem = {
    id: `correct-${Date.now()}-${Math.random()}`,
    shape: reference.shape,
    color: reference.color,
  };

  const options = shuffle([correctOption, ...decoys]);
  return { reference, options, correctId: correctOption.id };
}
