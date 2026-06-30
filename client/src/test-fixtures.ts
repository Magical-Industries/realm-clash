import {
  createGame,
  type CardTemplate,
  type Direction,
  type GameState,
  type HandCard,
  type MutualAttack,
  type PlacementMode,
  type Position,
} from "@magicalindustries/realm-clash-core";

import type { UiPhase } from "./game-controller.js";
import { GameController } from "./game-controller.js";

export function cardTemplate(
  id: string,
  hp: number,
  arrows: CardTemplate["arrows"],
  rarity: CardTemplate["rarity"] = "common",
): CardTemplate {
  return { id, name: id, rarity, maxHp: hp, arrows };
}

export function handCards(player: string, cards: CardTemplate[]): HandCard[] {
  return cards.map((template, index) => ({
    instanceId: `${player}-${index}`,
    template,
  }));
}

/** Controller with test-only state injection (kept in test-support module). */
export class TestableGameController extends GameController {
  setTestState(state: GameState, phase: UiPhase): void {
    (this as { state: GameState }).state = state;
    (this as { phase: UiPhase }).phase = phase;
  }

  setTestInitialHands(playerId: 0 | 1, cards: HandCard[]): void {
    (this as { initialHands: Record<0 | 1, HandCard[]> }).initialHands[playerId] = cards;
  }

  setTestPlacementContext(options: {
    phase: UiPhase;
    selectedCardId: string;
    selectedPosition: Position;
    availableModes?: PlacementMode[];
    mutualAttacks: MutualAttack[];
    attackArrowOrder?: Direction[];
  }): void {
    (this as { phase: UiPhase }).phase = options.phase;
    (this as { selectedCardId: string | null }).selectedCardId = options.selectedCardId;
    (this as { selectedPosition: Position | null }).selectedPosition = options.selectedPosition;
    (this as { availableModes: PlacementMode[] }).availableModes =
      options.availableModes ?? ["attack"];
    (this as { mutualAttacks: MutualAttack[] }).mutualAttacks = options.mutualAttacks;
    (this as { mutualDirections: Direction[] }).mutualDirections = options.mutualAttacks.map(
      (attack) => attack.direction,
    );
    (this as { attackArrowOrder: Direction[] }).attackArrowOrder = options.attackArrowOrder ?? [];
  }
}

export function chainChoiceFixture(): GameState {
  const captured = cardTemplate("cap", 1, [
    { direction: 0, attack: 8, defense: 3 },
    { direction: 2, attack: 8, defense: 3 },
  ]);
  const north = cardTemplate("north", 10, [{ direction: 4, attack: 2, defense: 2 }]);
  const east = cardTemplate("east", 10, [{ direction: 6, attack: 2, defense: 2 }]);

  const state = createGame({
    player0Hand: handCards("p0", [
      captured,
      cardTemplate("x1", 20, [{ direction: 1, attack: 2, defense: 2 }]),
      cardTemplate("x2", 20, [{ direction: 2, attack: 2, defense: 2 }]),
      cardTemplate("x3", 20, [{ direction: 3, attack: 2, defense: 2 }]),
      cardTemplate("x4", 20, [{ direction: 4, attack: 2, defense: 2 }]),
    ]),
    player1Hand: handCards("p1", [
      north,
      east,
      cardTemplate("y1", 20, [{ direction: 5, attack: 2, defense: 2 }]),
      cardTemplate("y2", 20, [{ direction: 6, attack: 2, defense: 2 }]),
      cardTemplate("y3", 20, [{ direction: 7, attack: 2, defense: 2 }]),
    ]),
    startingPlayer: 1,
  });

  const grid = state.grid.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (rowIndex === 1 && colIndex === 1) {
        return {
          instanceId: "cap-board",
          template: captured,
          owner: 0 as const,
          currentHp: 1,
          position: { row: 1, col: 1 },
        };
      }
      if (rowIndex === 0 && colIndex === 1) {
        return {
          instanceId: "north-board",
          template: north,
          owner: 1 as const,
          currentHp: 10,
          position: { row: 0, col: 1 },
        };
      }
      if (rowIndex === 1 && colIndex === 2) {
        return {
          instanceId: "east-board",
          template: east,
          owner: 1 as const,
          currentHp: 10,
          position: { row: 1, col: 2 },
        };
      }
      return cell;
    }),
  );

  return {
    ...state,
    currentPlayer: 1,
    grid,
    pending: {
      type: "chain_choice",
      captor: 0,
      attackerInstanceId: "cap-board",
      options: [
        {
          attackerInstanceId: "cap-board",
          direction: 0,
          defenderInstanceId: "north-board",
          defenderPosition: { row: 0, col: 1 },
        },
        {
          attackerInstanceId: "cap-board",
          direction: 2,
          defenderInstanceId: "east-board",
          defenderPosition: { row: 1, col: 2 },
        },
      ],
    },
  };
}