import { MIN_DAMAGE, OPPOSITE_DIRECTION } from "./constants.js";
import { getArrow } from "./grid.js";
import type {
  BoardCard,
  Direction,
  GameConfig,
  GameEvent,
  Rng,
} from "./types.js";

export type CompareOutcome = "attacker_wins" | "defender_wins" | "tie";

export interface AttackCompareResult {
  outcome: CompareOutcome;
  attackValue: number;
  defenseValue: number;
}

export function effectiveAttack(
  attacker: BoardCard,
  defender: BoardCard,
  direction: Direction,
  elementBonusEnabled: boolean,
): number {
  const arrow = getArrow(attacker, direction);
  if (!arrow) return 0;
  let attack = arrow.attack;
  if (
    elementBonusEnabled &&
    attacker.template.element &&
    attacker.template.element === defender.template.element
  ) {
    attack += 1;
  }
  return attack;
}

export function compareAttack(
  attacker: BoardCard,
  defender: BoardCard,
  direction: Direction,
  elementBonusEnabled: boolean,
): AttackCompareResult {
  const attackValue = effectiveAttack(attacker, defender, direction, elementBonusEnabled);
  const opposite = OPPOSITE_DIRECTION[direction] as Direction;
  const defenseArrow = getArrow(defender, opposite);
  const defenseValue = defenseArrow?.defense ?? 0;

  let outcome: CompareOutcome;
  if (attackValue > defenseValue) outcome = "attacker_wins";
  else if (attackValue < defenseValue) outcome = "defender_wins";
  else outcome = "tie";

  return { outcome, attackValue, defenseValue };
}

export function computeHitDamage(attackValue: number, roll: number): number {
  return Math.max(MIN_DAMAGE, (attackValue + roll) * 2);
}

export function computeCounterDamage(
  attackValue: number,
  defenseValue: number,
  roll: number,
): number {
  return Math.max(MIN_DAMAGE, defenseValue - attackValue + roll);
}

export interface SingleAttackResult {
  events: GameEvent[];
  defenderHp: number;
  attackerHp: number;
  capturedInstanceId: string | null;
  captor: BoardCard["owner"] | null;
}

export function resolveSingleAttack(
  attacker: BoardCard,
  defender: BoardCard,
  direction: Direction,
  config: GameConfig,
  rng: Rng,
): SingleAttackResult {
  const events: GameEvent[] = [];
  const compare = compareAttack(
    attacker,
    defender,
    direction,
    config.elementBonusEnabled,
  );

  events.push({
    type: "attack_compare",
    attackerInstanceId: attacker.instanceId,
    defenderInstanceId: defender.instanceId,
    direction,
    attackValue: compare.attackValue,
    defenseValue: compare.defenseValue,
    outcome: compare.outcome,
  });

  let defenderHp = defender.currentHp;
  let attackerHp = attacker.currentHp;
  let capturedInstanceId: string | null = null;
  let captor: BoardCard["owner"] | null = null;

  if (compare.outcome === "attacker_wins") {
    const roll = rng.rollDie(6);
    const damage = computeHitDamage(compare.attackValue, roll);
    defenderHp -= damage;
    events.push({
      type: "damage",
      targetInstanceId: defender.instanceId,
      amount: damage,
      source: "hit",
      roll,
    });
    if (defenderHp <= 0) {
      capturedInstanceId = defender.instanceId;
      captor = attacker.owner;
      defenderHp = config.captureSurvivorHp;
      events.push({
        type: "combat_capture",
        captor: attacker.owner,
        capturedInstanceId: defender.instanceId,
        survivorHp: defenderHp,
      });
    }
  } else if (compare.outcome === "defender_wins") {
    const roll = rng.rollDie(6);
    const damage = computeCounterDamage(
      compare.attackValue,
      compare.defenseValue,
      roll,
    );
    attackerHp -= damage;
    events.push({
      type: "damage",
      targetInstanceId: attacker.instanceId,
      amount: damage,
      source: "counter",
      roll,
    });
    if (attackerHp <= 0) {
      capturedInstanceId = attacker.instanceId;
      captor = defender.owner;
      attackerHp = config.captureSurvivorHp;
      events.push({
        type: "combat_capture",
        captor: defender.owner,
        capturedInstanceId: attacker.instanceId,
        survivorHp: attackerHp,
      });
    }
  }

  return {
    events,
    defenderHp,
    attackerHp,
    capturedInstanceId,
    captor,
  };
}