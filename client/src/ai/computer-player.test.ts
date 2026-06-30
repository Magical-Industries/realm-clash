import { ScriptedRng, type GameState } from "@magicalindustries/realm-clash-core";
import { describe, expect, it } from "vitest";

import { cardTemplate, handCards } from "../test-fixtures.js";
import { pickComputerAttackOrder, pickComputerChain } from "./computer-player.js";

function chainStateWithEqualOptions(): GameState {
  const attackerTemplate = cardTemplate("atk", 20, [
    { direction: 0, attack: 5, defense: 3 },
    { direction: 2, attack: 5, defense: 3 },
  ]);
  const defenderA = cardTemplate("def-a", 10, [{ direction: 4, attack: 2, defense: 2 }]);
  const defenderB = cardTemplate("def-b", 10, [{ direction: 6, attack: 2, defense: 2 }]);

  return {
    status: "active",
    turnNumber: 1,
    currentPlayer: 0,
    winner: null,
    hands: [handCards("p0", []), handCards("p1", [])],
    grid: [
      [
        null,
        {
          instanceId: "def-a-board",
          template: defenderA,
          owner: 1,
          currentHp: 10,
          position: { row: 0, col: 1 },
        },
        null,
        null,
      ],
      [
        null,
        {
          instanceId: "atk-board",
          template: attackerTemplate,
          owner: 0,
          currentHp: 20,
          position: { row: 1, col: 1 },
        },
        {
          instanceId: "def-b-board",
          template: defenderB,
          owner: 1,
          currentHp: 10,
          position: { row: 1, col: 2 },
        },
        null,
      ],
      [null, null, null, null],
      [null, null, null, null],
    ],
    pending: {
      type: "chain_choice",
      captor: 0,
      attackerInstanceId: "atk-board",
      options: [
        {
          attackerInstanceId: "atk-board",
          direction: 0,
          defenderInstanceId: "def-a-board",
          defenderPosition: { row: 0, col: 1 },
        },
        {
          attackerInstanceId: "atk-board",
          direction: 2,
          defenderInstanceId: "def-b-board",
          defenderPosition: { row: 1, col: 2 },
        },
      ],
    },
    config: { elementBonusEnabled: true },
  };
}

describe("pickComputerAttackOrder", () => {
  it("orders stronger mutual attacks ahead of weaker ones", () => {
    const order = pickComputerAttackOrder(
      [
        {
          direction: 4,
          defenderInstanceId: "south-board",
          defenderPosition: { row: 2, col: 1 },
          attackValue: 5,
          defenseValue: 4,
        },
        {
          direction: 0,
          defenderInstanceId: "north-board",
          defenderPosition: { row: 0, col: 1 },
          attackValue: 9,
          defenseValue: 2,
        },
      ],
      new ScriptedRng([1]),
    );

    expect(order).toEqual([0, 4]);
  });

  it("randomly breaks ties between equally scored attack targets", () => {
    const state = chainStateWithEqualOptions();
    const mutualAttacks = state.pending!.options.map((option) => ({
      direction: option.direction,
      defenderInstanceId: option.defenderInstanceId,
      defenderPosition: option.defenderPosition,
      attackValue: 5,
      defenseValue: 2,
    }));

    const firstPick = pickComputerAttackOrder(mutualAttacks, new ScriptedRng([1]));
    const secondPick = pickComputerAttackOrder(mutualAttacks, new ScriptedRng([2]));

    expect(firstPick).toEqual([0, 2]);
    expect(secondPick).toEqual([2, 0]);
  });
});

describe("pickComputerChain", () => {
  it("returns a valid chain command for pending options", () => {
    const state = chainStateWithEqualOptions();
    const choice = pickComputerChain(state, 0, new ScriptedRng([1]));

    expect(choice).toEqual({
      attackerInstanceId: "atk-board",
      direction: state.pending!.options[0]!.direction,
    });
  });

  it("randomly breaks ties between equally scored chain options", () => {
    const state = chainStateWithEqualOptions();

    const firstPick = pickComputerChain(state, 0, new ScriptedRng([1]));
    const secondPick = pickComputerChain(state, 0, new ScriptedRng([2]));

    expect(firstPick?.direction).toBe(0);
    expect(secondPick?.direction).toBe(2);
  });
});