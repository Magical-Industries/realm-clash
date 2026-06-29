import type { Direction, GameConfig, Rarity } from "./types.js";

export const GRID_SIZE = 4;
export const CARDS_PER_PLAYER = 5;
export const MAX_CHAIN_DEPTH = 4;
export const MAX_RESOLUTIONS_PER_PLACEMENT = 12;
export const CAPTURE_SURVIVOR_HP = 1;
export const MIN_DAMAGE = 1;

export const DIRECTION_COUNT = 8;

/** Row/col delta for each direction (N, NE, E, SE, S, SW, W, NW). */
export const DIRECTION_DELTA: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
];

export const OPPOSITE_DIRECTION: ReadonlyArray<Direction> = [
  4, 5, 6, 7, 0, 1, 2, 3,
];

export const RARITY_VALUE: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  ultra: 4,
  secret: 5,
  legendary: 6,
};

export interface RarityTuning {
  hpMin: number;
  hpMax: number;
  arrowMin: number;
  arrowMax: number;
  attackMin: number;
  attackMax: number;
  defenseMin: number;
  defenseMax: number;
}

export const RARITY_TUNING: Record<Rarity, RarityTuning> = {
  common: {
    hpMin: 0x10,
    hpMax: 0x30,
    arrowMin: 1,
    arrowMax: 3,
    attackMin: 1,
    attackMax: 5,
    defenseMin: 1,
    defenseMax: 5,
  },
  uncommon: {
    hpMin: 0x28,
    hpMax: 0x50,
    arrowMin: 2,
    arrowMax: 4,
    attackMin: 2,
    attackMax: 7,
    defenseMin: 2,
    defenseMax: 7,
  },
  rare: {
    hpMin: 0x45,
    hpMax: 0x80,
    arrowMin: 3,
    arrowMax: 5,
    attackMin: 4,
    attackMax: 9,
    defenseMin: 4,
    defenseMax: 9,
  },
  ultra: {
    hpMin: 0x70,
    hpMax: 0xc0,
    arrowMin: 4,
    arrowMax: 6,
    attackMin: 6,
    attackMax: 12,
    defenseMin: 6,
    defenseMax: 12,
  },
  secret: {
    hpMin: 0xa0,
    hpMax: 0xf0,
    arrowMin: 5,
    arrowMax: 7,
    attackMin: 6,
    attackMax: 13,
    defenseMin: 6,
    defenseMax: 13,
  },
  legendary: {
    hpMin: 0xc0,
    hpMax: 0x180,
    arrowMin: 6,
    arrowMax: 8,
    attackMin: 7,
    attackMax: 15,
    defenseMin: 7,
    defenseMax: 15,
  },
};

export const DEFAULT_CONFIG: GameConfig = {
  gridSize: 4,
  cardsPerPlayer: CARDS_PER_PLAYER,
  maxChainDepth: MAX_CHAIN_DEPTH,
  maxResolutionsPerPlacement: MAX_RESOLUTIONS_PER_PLACEMENT,
  elementBonusEnabled: false,
  ownershipMode: "casual",
  captureSurvivorHp: CAPTURE_SURVIVOR_HP,
};