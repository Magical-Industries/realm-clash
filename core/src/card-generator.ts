import { RARITY_TUNING } from "./constants.js";
import type { Arrow, CardTemplate, Direction, Rarity, Rng } from "./types.js";

const ALL_DIRECTIONS: Direction[] = [0, 1, 2, 3, 4, 5, 6, 7];

function weightedInt(rng: Rng, min: number, max: number, skewHigh: boolean): number {
  const a = rng.rollDie(max - min + 1) + min - 1;
  const b = rng.rollDie(max - min + 1) + min - 1;
  return skewHigh ? Math.max(a, b) : Math.min(a, b);
}

function pickDirections(rng: Rng, count: number): Direction[] {
  const pool = [...ALL_DIRECTIONS];
  const picked: Direction[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = rng.rollDie(pool.length) - 1;
    const [dir] = pool.splice(index, 1);
    if (dir !== undefined) picked.push(dir);
  }
  return picked.sort((a, b) => a - b);
}

export interface GenerateCardOptions {
  id: string;
  name: string;
  rarity: Rarity;
  element?: CardTemplate["element"];
}

export function generateCard(
  options: GenerateCardOptions,
  rng: Rng,
): CardTemplate {
  const tuning = RARITY_TUNING[options.rarity];
  const arrowCount = weightedInt(
    rng,
    tuning.arrowMin,
    tuning.arrowMax,
    true,
  );
  const maxHp = weightedInt(rng, tuning.hpMin, tuning.hpMax, true);
  const directions = pickDirections(rng, arrowCount);
  const arrows: Arrow[] = [];

  for (const direction of directions) {
    let attack = weightedInt(rng, tuning.attackMin, tuning.attackMax, true);
    let defense = weightedInt(rng, tuning.defenseMin, tuning.defenseMax, true);
    if (attack === 15 && defense === 15) {
      defense = Math.max(tuning.defenseMin, defense - rng.rollDie(3));
    }
    arrows.push({ direction, attack, defense });
  }

  const attacks = arrows.map((a) => a.attack);
  const minAttack = Math.min(...attacks);
  const maxAttack = Math.max(...attacks);
  if (maxAttack - minAttack < 2 && arrows[0]) {
    arrows[0] = {
      ...arrows[0],
      attack: Math.min(tuning.attackMax, arrows[0].attack + 1),
    };
  }

  return {
    id: options.id,
    name: options.name,
    rarity: options.rarity,
    maxHp,
    element: options.element,
    arrows,
  };
}

export function createHandCard(template: CardTemplate, instanceId: string) {
  return { instanceId, template };
}