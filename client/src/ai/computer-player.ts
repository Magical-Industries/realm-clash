import {
  analyzePlacementForHandCard,
  findCardById,
  getArrow,
  getAvailableModes,
  getLegalPositions,
  type ChainChoiceCommand,
  type GameState,
  type PlacementAnalysis,
  type MutualAttack,
  type PlacementMode,
  type PlayerId,
  type Position,
  type Rng,
  type Direction,
} from "@magicalindustries/realm-clash-core";

export interface ComputerPlacement {
  cardInstanceId: string;
  position: Position;
  mode: PlacementMode;
}

function scorePlacement(
  analysis: PlacementAnalysis,
  mode: PlacementMode,
  state: GameState,
  playerId: PlayerId,
): number {
  let score = 0;
  const opponent: PlayerId = playerId === 0 ? 1 : 0;

  if (mode === "capture") {
    score += analysis.captureTargets.length * 80;
    for (const target of analysis.captureTargets) {
      const defender = findCardById(state, target.defenderInstanceId);
      if (defender) {
        score += defender.card.currentHp * 0.15;
        if (defender.card.owner === opponent) score += 20;
      }
    }
  }

  if (mode === "attack") {
    for (const mutual of analysis.mutualAttacks) {
      const advantage = mutual.attackValue - mutual.defenseValue;
      score += advantage * 12 + mutual.attackValue * 6;
      const defender = findCardById(state, mutual.defenderInstanceId);
      if (defender && defender.card.currentHp <= mutual.attackValue * 4) {
        score += 40;
      }
    }
  }

  if (mode === "none") {
    const centerDistance =
      Math.abs(analysis.position.row - 1.5) + Math.abs(analysis.position.col - 1.5);
    score += (3 - centerDistance) * 4;
  }

  return score;
}

export function pickComputerPlacement(
  state: GameState,
  playerId: PlayerId,
): ComputerPlacement | null {
  const hand = state.hands[playerId];
  const positions = getLegalPositions(state, playerId);
  if (hand.length === 0 || positions.length === 0) return null;

  let best: ComputerPlacement | null = null;
  let bestScore = -Infinity;

  for (const card of hand) {
    for (const position of positions) {
      const analysis = analyzePlacementForHandCard(
        state,
        playerId,
        card.instanceId,
        position,
      );
      if (!analysis) continue;

      const modes = getAvailableModes(analysis).filter((m) => m !== "none");
      const tryModes: PlacementMode[] = modes.length > 0 ? modes : ["none"];

      for (const mode of tryModes) {
        const score = scorePlacement(analysis, mode, state, playerId);
        if (score > bestScore) {
          bestScore = score;
          best = { cardInstanceId: card.instanceId, position, mode };
        }
      }
    }
  }

  return best;
}

function scoreMutualAttack(mutual: MutualAttack): number {
  return mutual.attackValue * 50 - mutual.defenseValue;
}

export function pickComputerAttackOrder(
  mutualAttacks: MutualAttack[],
  rng: Rng,
): Direction[] {
  if (mutualAttacks.length <= 1) {
    return mutualAttacks.map((attack) => attack.direction);
  }

  const remaining = [...mutualAttacks];
  const order: Direction[] = [];

  while (remaining.length > 0) {
    let bestScore = -Infinity;
    const tied: MutualAttack[] = [];

    for (const mutual of remaining) {
      const score = scoreMutualAttack(mutual);
      if (score > bestScore) {
        bestScore = score;
        tied.length = 0;
        tied.push(mutual);
      } else if (score === bestScore) {
        tied.push(mutual);
      }
    }

    const picked =
      tied.length === 1 ? tied[0]! : tied[rng.rollDie(tied.length) - 1]!;
    order.push(picked.direction);
    const pickedIndex = remaining.findIndex((mutual) => mutual.direction === picked.direction);
    remaining.splice(pickedIndex, 1);
  }

  return order;
}

export function pickComputerChain(
  state: GameState,
  playerId: PlayerId,
  rng: Rng,
): Omit<ChainChoiceCommand, "playerId"> | null {
  const pending = state.pending;
  if (!pending || pending.options.length === 0) return null;

  let bestScore = -Infinity;
  const tied: typeof pending.options = [];

  for (const option of pending.options) {
    const attacker = findCardById(state, option.attackerInstanceId);
    const defender = findCardById(state, option.defenderInstanceId);
    if (!attacker || !defender) continue;

    const arrow = getArrow(attacker.card, option.direction);
    const attack = arrow?.attack ?? 0;
    const score = attack * 50 - defender.card.currentHp + (defender.card.owner !== playerId ? 30 : 0);

    if (score > bestScore) {
      bestScore = score;
      tied.length = 0;
      tied.push(option);
    } else if (score === bestScore) {
      tied.push(option);
    }
  }

  if (tied.length === 0) return null;

  const best = tied[rng.rollDie(tied.length) - 1]!;

  return {
    attackerInstanceId: best.attackerInstanceId,
    direction: best.direction,
  };
}