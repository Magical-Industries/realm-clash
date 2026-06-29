import {
  createHandCard,
  generateCard,
  type Element,
  type HandCard,
  type Rarity,
  type Rng,
} from "@magicalindustries/realm-clash-core";

import type { HandBias } from "./difficulty.js";

const RARITIES: Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "ultra",
  "secret",
  "legendary",
];

const RARITY_WEIGHTS: Record<HandBias, Record<Rarity, number>> = {
  weak: {
    common: 42,
    uncommon: 30,
    rare: 18,
    ultra: 8,
    secret: 2,
    legendary: 0,
  },
  balanced: {
    common: 24,
    uncommon: 26,
    rare: 24,
    ultra: 14,
    secret: 8,
    legendary: 4,
  },
  strong: {
    common: 10,
    uncommon: 18,
    rare: 28,
    ultra: 24,
    secret: 12,
    legendary: 8,
  },
  brutal: {
    common: 4,
    uncommon: 10,
    rare: 22,
    ultra: 28,
    secret: 22,
    legendary: 14,
  },
};

export interface DealHandsContext {
  rng: Rng;
  bias: HandBias;
  idPrefix: string;
  playerLabel: string;
  element: Element;
  namesByRarity: Record<Rarity, string[]>;
  cardsPerPlayer?: number;
}

function rollRarity(rng: Rng, bias: HandBias): Rarity {
  const weights = RARITY_WEIGHTS[bias];
  const total = RARITIES.reduce((sum, rarity) => sum + weights[rarity], 0);
  let roll = rng.rollDie(total);
  for (const rarity of RARITIES) {
    roll -= weights[rarity];
    if (roll <= 0) return rarity;
  }
  return "common";
}

export function dealPlayerHand(context: DealHandsContext): HandCard[] {
  const count = context.cardsPerPlayer ?? 5;
  const hand: HandCard[] = [];

  for (let i = 0; i < count; i += 1) {
    const rarity = rollRarity(context.rng, context.bias);
    const names = context.namesByRarity[rarity];
    const name = names[context.rng.rollDie(names.length) - 1] ?? `Unit ${i + 1}`;
    const template = generateCard(
      {
        id: `${context.idPrefix}-${context.playerLabel}-${rarity}-${i}`,
        name,
        rarity,
        element: context.element,
      },
      context.rng,
    );
    hand.push(createHandCard(template, `${context.playerLabel}-${i}`));
  }

  return hand;
}