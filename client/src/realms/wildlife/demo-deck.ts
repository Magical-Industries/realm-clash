import type { HandCard, Rarity, Rng } from "@magicalindustries/realm-clash-core";

import {
  handBiasFor,
  type Difficulty,
} from "../../match/difficulty.js";
import { dealPlayerHand } from "../../match/deal-hands.js";
import type { MatchMode } from "../../match/types.js";

const WILDLIFE_NAMES: Record<Rarity, string[]> = {
  common: ["Impala", "Warthog", "Hyena", "Gazelle", "Vulture"],
  uncommon: ["Zebra", "Cheetah", "Baboon", "Jackal", "Ostrich"],
  rare: ["Leopard", "Buffalo", "Crocodile", "Kudu", "Hippo"],
  ultra: ["Giraffe", "Rhinoceros", "Eagle", "Wild Dog", "Secretary Bird"],
  secret: ["White Rhino", "Ancient Elephant", "King Cheetah", "Spirit Cat", "Ghost"],
  legendary: ["Savanna King", "Eternal Matriarch", "Apex Lion", "Storm Hippo", "Titan"],
};

export interface WildlifeDealOptions {
  mode: MatchMode;
  difficulty: Difficulty;
  rng: Rng;
}

export function createWildlifeMatchHands(
  options: WildlifeDealOptions,
): { player0: HandCard[]; player1: HandCard[] } {
  const { mode, difficulty, rng } = options;
  const base = {
    rng,
    idPrefix: "wildlife",
    element: "savanna" as const,
    namesByRarity: WILDLIFE_NAMES,
  };

  return {
    player0: dealPlayerHand({
      ...base,
      playerLabel: "P0",
      bias:
        mode === "cpu"
          ? handBiasFor(mode, difficulty, "cpu")
          : handBiasFor(mode, difficulty, "pvp"),
    }),
    player1: dealPlayerHand({
      ...base,
      playerLabel: "P1",
      bias:
        mode === "cpu"
          ? handBiasFor(mode, difficulty, "human")
          : handBiasFor(mode, difficulty, "pvp"),
    }),
  };
}