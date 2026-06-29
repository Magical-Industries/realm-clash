import { DEFAULT_CONFIG, GRID_SIZE } from "./constants.js";
import { analyzePlacement } from "./analysis.js";
import { createHandCard } from "./card-generator.js";
import { emptyCells } from "./grid.js";
import { applyChainChoice, applyPlacement, getChainOptions } from "./resolution.js";
import { computeScores, determineWinner } from "./scoring.js";
import type {
  CardTemplate,
  GameConfig,
  GameState,
  HandCard,
  PlacementAnalysis,
  PlayerId,
  Position,
} from "./types.js";

function emptyGrid(): (null)[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null),
  );
}

export interface CreateGameInput {
  player0Hand: HandCard[];
  player1Hand: HandCard[];
  config?: Partial<GameConfig>;
  startingPlayer?: PlayerId;
}

export function createGame(input: CreateGameInput): GameState {
  const config: GameConfig = { ...DEFAULT_CONFIG, ...input.config };

  if (input.player0Hand.length !== config.cardsPerPlayer) {
    throw new Error(`Player 0 must have exactly ${config.cardsPerPlayer} cards`);
  }
  if (input.player1Hand.length !== config.cardsPerPlayer) {
    throw new Error(`Player 1 must have exactly ${config.cardsPerPlayer} cards`);
  }

  return {
    config,
    grid: emptyGrid(),
    hands: {
      0: [...input.player0Hand],
      1: [...input.player1Hand],
    },
    placementsCount: { 0: 0, 1: 0 },
    currentPlayer: input.startingPlayer ?? 0,
    turnNumber: 1,
    status: "active",
    winner: null,
    placementResolutionCount: 0,
    pending: null,
    resolutionQueue: [],
  };
}

export function buildHandFromTemplates(
  templates: CardTemplate[],
  idPrefix: string,
): HandCard[] {
  return templates.map((template, index) =>
    createHandCard(template, `${idPrefix}-${index}`),
  );
}

export function getLegalPositions(state: GameState, playerId: PlayerId): Position[] {
  if (state.status !== "active" || state.currentPlayer !== playerId) return [];
  if (state.pending) return [];
  if (state.hands[playerId].length === 0) return [];
  return emptyCells(state);
}

export function analyzePlacementForHandCard(
  state: GameState,
  playerId: PlayerId,
  cardInstanceId: string,
  position: Position,
): PlacementAnalysis | null {
  const card = state.hands[playerId].find((c) => c.instanceId === cardInstanceId);
  if (!card) return null;

  const preview = {
    instanceId: card.instanceId,
    template: card.template,
    owner: playerId,
    currentHp: card.template.maxHp,
    position,
  };

  return analyzePlacement(state, preview, position);
}

export {
  applyPlacement,
  applyChainChoice,
  getChainOptions,
  computeScores,
  determineWinner,
};