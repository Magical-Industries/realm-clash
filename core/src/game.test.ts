import { describe, expect, it } from "vitest";
import { analyzePlacementForHandCard, applyChainChoice, applyPlacement, createGame } from "./game.js";
import { ScriptedRng } from "./rng.js";
import type { CardTemplate, HandCard } from "./types.js";

function template(
  id: string,
  hp: number,
  arrows: CardTemplate["arrows"],
  rarity: CardTemplate["rarity"] = "common",
): CardTemplate {
  return { id, name: id, rarity, maxHp: hp, arrows };
}

function hand(player: string, cards: CardTemplate[]): HandCard[] {
  return cards.map((t, i) => ({ instanceId: `${player}-${i}`, template: t }));
}

describe("game rules", () => {
  it("instant capture flips undefended neighbor in capture mode", () => {
    const lion = template("lion", 32, [{ direction: 0, attack: 5, defense: 3 }]);
    const zebra = template("zebra", 32, [{ direction: 2, attack: 3, defense: 4 }]);

    let state = createGame({
      player0Hand: hand("p0", [lion, template("filler0", 20, [{ direction: 1, attack: 2, defense: 2 }]), template("f2", 20, [{ direction: 2, attack: 2, defense: 2 }]), template("f3", 20, [{ direction: 3, attack: 2, defense: 2 }]), template("f4", 20, [{ direction: 4, attack: 2, defense: 2 }])]),
      player1Hand: hand("p1", [zebra, template("filler1", 20, [{ direction: 5, attack: 2, defense: 2 }]), template("g2", 20, [{ direction: 6, attack: 2, defense: 2 }]), template("g3", 20, [{ direction: 7, attack: 2, defense: 2 }]), template("g4", 20, [{ direction: 0, attack: 2, defense: 2 }])]),
      startingPlayer: 1,
    });

    state = applyPlacement(state, { playerId: 1, cardInstanceId: "p1-0", position: { row: 0, col: 1 }, mode: "none" }, new ScriptedRng([])).state;

    const result = applyPlacement(
      state,
      {
        playerId: 0,
        cardInstanceId: "p0-0",
        position: { row: 1, col: 1 },
        mode: "capture",
      },
      new ScriptedRng([]),
    );

    expect(result.ok).toBe(true);
    expect(result.events.some((e) => e.type === "instant_capture")).toBe(true);
    expect(result.state.grid[0]?.[1]?.owner).toBe(0);
  });

  it("attack mode damages but does not instant-capture", () => {
    const attacker = template("atk", 40, [{ direction: 0, attack: 9, defense: 4 }]);
    const defender = template("def", 40, [{ direction: 4, attack: 3, defense: 5 }]);

    let state = createGame({
      player0Hand: hand("p0", [attacker, template("a2", 20, [{ direction: 1, attack: 2, defense: 2 }]), template("a3", 20, [{ direction: 2, attack: 2, defense: 2 }]), template("a4", 20, [{ direction: 3, attack: 2, defense: 2 }]), template("a5", 20, [{ direction: 4, attack: 2, defense: 2 }])]),
      player1Hand: hand("p1", [defender, template("d2", 20, [{ direction: 5, attack: 2, defense: 2 }]), template("d3", 20, [{ direction: 6, attack: 2, defense: 2 }]), template("d4", 20, [{ direction: 7, attack: 2, defense: 2 }]), template("d5", 20, [{ direction: 0, attack: 2, defense: 2 }])]),
      startingPlayer: 1,
    });

    state = applyPlacement(state, { playerId: 1, cardInstanceId: "p1-0", position: { row: 0, col: 1 }, mode: "none" }, new ScriptedRng([])).state;

    const analysis = analyzePlacementForHandCard(state, 0, "p0-0", { row: 1, col: 1 });
    expect(analysis?.availableModes).toContain("attack");

    const result = applyPlacement(
      state,
      {
        playerId: 0,
        cardInstanceId: "p0-0",
        position: { row: 1, col: 1 },
        mode: "attack",
        attackArrowOrder: [0],
      },
      new ScriptedRng([4]),
    );

    expect(result.ok).toBe(true);
    expect(result.events.some((e) => e.type === "damage")).toBe(true);
    expect(result.state.grid[0]?.[1]?.owner).toBe(1);
    expect(result.state.grid[0]?.[1]?.currentHp).toBe(14);
  });

  it("requires chain choice when multiple chain attacks are available", () => {
    const captured = template("cap", 1, [
      { direction: 0, attack: 8, defense: 3 },
      { direction: 2, attack: 8, defense: 3 },
    ]);
    const north = template("north", 10, [{ direction: 4, attack: 2, defense: 2 }]);
    const east = template("east", 10, [{ direction: 6, attack: 2, defense: 2 }]);

    const state = createGame({
      player0Hand: hand("p0", [captured, template("x1", 20, [{ direction: 1, attack: 2, defense: 2 }]), template("x2", 20, [{ direction: 2, attack: 2, defense: 2 }]), template("x3", 20, [{ direction: 3, attack: 2, defense: 2 }]), template("x4", 20, [{ direction: 4, attack: 2, defense: 2 }])]),
      player1Hand: hand("p1", [north, east, template("y1", 20, [{ direction: 5, attack: 2, defense: 2 }]), template("y2", 20, [{ direction: 6, attack: 2, defense: 2 }]), template("y3", 20, [{ direction: 7, attack: 2, defense: 2 }])]),
      startingPlayer: 0,
    });

    let grid = state.grid;
    grid = grid.map((row, r) =>
      row.map((cell, c) => {
        if (r === 1 && c === 1) {
          return {
            instanceId: "cap-board",
            template: captured,
            owner: 0 as const,
            currentHp: 1,
            position: { row: 1, col: 1 },
          };
        }
        if (r === 0 && c === 1) {
          return {
            instanceId: "north-board",
            template: north,
            owner: 1 as const,
            currentHp: 10,
            position: { row: 0, col: 1 },
          };
        }
        if (r === 1 && c === 2) {
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

    const midState = {
      ...state,
      grid,
      pending: {
        type: "chain_choice" as const,
        captor: 0 as const,
        attackerInstanceId: "cap-board",
        options: [
          {
            attackerInstanceId: "cap-board",
            direction: 0 as const,
            defenderInstanceId: "north-board",
            defenderPosition: { row: 0, col: 1 },
          },
          {
            attackerInstanceId: "cap-board",
            direction: 2 as const,
            defenderInstanceId: "east-board",
            defenderPosition: { row: 1, col: 2 },
          },
        ],
      },
    };

    const continued = applyChainChoice(
      midState,
      { playerId: 0, attackerInstanceId: "cap-board", direction: 0 },
      new ScriptedRng([6]),
    );

    expect(continued.ok).toBe(true);
    expect(continued.events.some((e) => e.type === "attack_compare")).toBe(true);
  });

  it("rejects attack mode when only capture is available", () => {
    const lion = template("lion", 32, [{ direction: 0, attack: 5, defense: 3 }]);
    const zebra = template("zebra", 32, [{ direction: 2, attack: 3, defense: 4 }]);

    let state = createGame({
      player0Hand: hand("p0", [lion, template("f0", 20, [{ direction: 1, attack: 2, defense: 2 }]), template("f1", 20, [{ direction: 2, attack: 2, defense: 2 }]), template("f2", 20, [{ direction: 3, attack: 2, defense: 2 }]), template("f3", 20, [{ direction: 4, attack: 2, defense: 2 }])]),
      player1Hand: hand("p1", [zebra, template("g0", 20, [{ direction: 5, attack: 2, defense: 2 }]), template("g1", 20, [{ direction: 6, attack: 2, defense: 2 }]), template("g2", 20, [{ direction: 7, attack: 2, defense: 2 }]), template("g3", 20, [{ direction: 0, attack: 2, defense: 2 }])]),
      startingPlayer: 1,
    });

    state = applyPlacement(state, { playerId: 1, cardInstanceId: "p1-0", position: { row: 0, col: 1 }, mode: "none" }, new ScriptedRng([])).state;

    const result = applyPlacement(
      state,
      {
        playerId: 0,
        cardInstanceId: "p0-0",
        position: { row: 1, col: 1 },
        mode: "attack",
        attackArrowOrder: [0],
      },
      new ScriptedRng([4]),
    );

    expect(result.ok).toBe(false);
  });
});