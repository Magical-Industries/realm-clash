import { describe, expect, it } from "vitest";
import {
  compareAttack,
  computeCounterDamage,
  computeHitDamage,
  resolveSingleAttack,
} from "./combat.js";
import { ScriptedRng } from "./rng.js";
import type { BoardCard, CardTemplate } from "./types.js";

function card(
  id: string,
  owner: 0 | 1,
  hp: number,
  arrows: CardTemplate["arrows"],
): BoardCard {
  return {
    instanceId: id,
    owner,
    currentHp: hp,
    position: { row: 0, col: 0 },
    template: {
      id,
      name: id,
      rarity: "common",
      maxHp: hp,
      arrows,
    },
  };
}

describe("combat", () => {
  it("computes hit damage from README example", () => {
    expect(computeHitDamage(9, 4)).toBe(26);
  });

  it("enforces minimum damage of 1", () => {
    expect(computeHitDamage(1, 1)).toBe(4);
    expect(computeCounterDamage(1, 2, 1)).toBe(2);
  });

  it("tie produces no damage", () => {
    const attacker = card("a", 0, 40, [{ direction: 0, attack: 4, defense: 3 }]);
    const defender = card("d", 1, 40, [{ direction: 4, attack: 2, defense: 4 }]);
    const result = resolveSingleAttack(
      attacker,
      defender,
      0,
      { elementBonusEnabled: false } as never,
      new ScriptedRng([6]),
    );
    expect(result.events.some((e) => e.type === "damage")).toBe(false);
    expect(result.capturedInstanceId).toBeNull();
  });

  it("attacker win can capture at zero hp", () => {
    const attacker = card("a", 0, 40, [{ direction: 0, attack: 9, defense: 4 }]);
    const defender = card("d", 1, 26, [{ direction: 4, attack: 3, defense: 5 }]);
    const result = resolveSingleAttack(
      attacker,
      defender,
      0,
      {
        elementBonusEnabled: false,
        captureSurvivorHp: 1,
      } as never,
      new ScriptedRng([4]),
    );
    expect(result.capturedInstanceId).toBe("d");
    expect(result.captor).toBe(0);
    expect(result.defenderHp).toBe(1);
  });

  it("applies element bonus when enabled", () => {
    const attacker = card("a", 0, 40, [{ direction: 0, attack: 4, defense: 3 }]);
    attacker.template.element = "savanna";
    const defender = card("d", 1, 40, [{ direction: 4, attack: 2, defense: 4 }]);
    defender.template.element = "savanna";
    const compare = compareAttack(attacker, defender, 0, true);
    expect(compare.outcome).toBe("attacker_wins");
    expect(compare.attackValue).toBe(5);
  });
});