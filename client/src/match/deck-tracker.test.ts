import { createGame } from "@magicalindustries/realm-clash-core";
import { describe, expect, it } from "vitest";

import { cardTemplate, handCards } from "../test-fixtures.js";
import { computePlayerDeck } from "./deck-tracker.js";

describe("computePlayerDeck", () => {
  const filler = (id: string) =>
    cardTemplate(id, 20, [{ direction: 1, attack: 2, defense: 2 }]);
  const lion = cardTemplate("lion", 32, [{ direction: 0, attack: 5, defense: 3 }]);
  const zebra = cardTemplate("zebra", 28, [{ direction: 2, attack: 4, defense: 4 }]);
  const hippo = cardTemplate("hippo", 40, [{ direction: 4, attack: 6, defense: 5 }]);

  it("lists opening cards still in hand", () => {
    const initial = handCards("p1", [lion, zebra, hippo, filler("f1"), filler("f2")]);
    const state = createGame({
      player0Hand: handCards("p0", [lion, filler("a"), filler("b"), filler("c"), filler("d")]),
      player1Hand: initial,
      startingPlayer: 1,
    });

    const deck = computePlayerDeck(initial, state, 1);

    expect(deck).toHaveLength(5);
    expect(deck.every((entry) => entry.status === "in_hand")).toBe(true);
  });

  it("includes owned opening cards on the board", () => {
    const initial = handCards("p1", [lion, zebra, filler("f1"), filler("f2"), filler("f3")]);
    const state = createGame({
      player0Hand: handCards("p0", [hippo, filler("a"), filler("b"), filler("c"), filler("d")]),
      player1Hand: initial,
      startingPlayer: 1,
    });

    const grid = state.grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (rowIndex === 1 && colIndex === 1) {
          return {
            instanceId: initial[0]!.instanceId,
            template: lion,
            owner: 1 as const,
            currentHp: 24,
            position: { row: 1, col: 1 },
          };
        }
        return cell;
      }),
    );

    const deck = computePlayerDeck(initial, {
      ...state,
      grid,
      hands: {
        ...state.hands,
        1: state.hands[1].filter((card) => card.instanceId !== initial[0]!.instanceId),
      },
    }, 1);

    expect(deck).toHaveLength(5);
    expect(deck.find((entry) => entry.status === "on_board")?.currentHp).toBe(24);
    expect(deck.some((entry) => entry.status === "in_hand" && entry.card.instanceId === initial[1]!.instanceId)).toBe(
      true,
    );
  });

  it("adds captured enemy cards and excludes lost opening cards", () => {
    const initial = handCards("p1", [lion, zebra, filler("f1"), filler("f2"), filler("f3")]);
    const enemy = cardTemplate("enemy", 30, [{ direction: 6, attack: 4, defense: 3 }]);
    const state = createGame({
      player0Hand: handCards("p0", [hippo, filler("a"), filler("b"), filler("c"), filler("d")]),
      player1Hand: initial,
      startingPlayer: 1,
    });

    const grid = state.grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (rowIndex === 0 && colIndex === 1) {
          return {
            instanceId: "enemy-board",
            template: enemy,
            owner: 1 as const,
            currentHp: 1,
            position: { row: 0, col: 1 },
          };
        }
        if (rowIndex === 2 && colIndex === 1) {
          return {
            instanceId: initial[0]!.instanceId,
            template: lion,
            owner: 0 as const,
            currentHp: 1,
            position: { row: 2, col: 1 },
          };
        }
        return cell;
      }),
    );

    const deck = computePlayerDeck(initial, {
      ...state,
      grid,
      hands: {
        ...state.hands,
        1: state.hands[1].filter((card) => card.instanceId !== initial[0]!.instanceId),
      },
    }, 1);

    expect(deck).toHaveLength(5);
    expect(deck.some((entry) => entry.status === "captured" && entry.card.template.id === "enemy")).toBe(
      true,
    );
    expect(deck.some((entry) => entry.card.instanceId === initial[0]!.instanceId)).toBe(false);
  });
});