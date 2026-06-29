import {
  analyzePlacement,
  getAvailableModes,
  validateModeChoice,
} from "./analysis.js";
import { resolveSingleAttack } from "./combat.js";
import {
  cloneGrid,
  findCardById,
  getArrow,
  getCardAt,
  hasMutualArrow,
  neighbor,
  setCardAt,
} from "./grid.js";
import { computeScores, determineWinner } from "./scoring.js";
import type {
  ActionResult,
  BoardCard,
  ChainAttackOption,
  ChainChoiceCommand,
  Direction,
  GameEvent,
  GameState,
  PendingChainChoice,
  PlacementCommand,
  ResolutionFrame,
  Rng,
} from "./types.js";

function opponent(player: BoardCard["owner"]): BoardCard["owner"] {
  return player === 0 ? 1 : 0;
}

function updateBoardCard(
  state: GameState,
  instanceId: string,
  patch: Partial<BoardCard>,
): GameState {
  const located = findCardById(state, instanceId);
  if (!located) return state;
  const updated: BoardCard = { ...located.card, ...patch };
  return {
    ...state,
    grid: setCardAt(state.grid, located.position, updated),
  };
}

function transferOwnership(
  state: GameState,
  instanceId: string,
  newOwner: BoardCard["owner"],
  hp: number,
): GameState {
  return updateBoardCard(state, instanceId, { owner: newOwner, currentHp: hp });
}

function canResolveMore(state: GameState): boolean {
  return (
    state.placementResolutionCount < state.config.maxResolutionsPerPlacement
  );
}

function incrementResolution(state: GameState): GameState {
  return {
    ...state,
    placementResolutionCount: state.placementResolutionCount + 1,
  };
}

export function getChainOptions(
  state: GameState,
  attackerInstanceId: string,
  captor: BoardCard["owner"],
): ChainAttackOption[] {
  const located = findCardById(state, attackerInstanceId);
  if (!located || located.card.owner !== captor) return [];

  const options: ChainAttackOption[] = [];
  for (const arrow of located.card.template.arrows) {
    const adj = neighbor(located.position, arrow.direction);
    if (!adj) continue;
    const defender = getCardAt(state, adj);
    if (!defender || defender.owner === captor) continue;
    if (!hasMutualArrow(located.card, defender, arrow.direction)) continue;
    options.push({
      attackerInstanceId,
      direction: arrow.direction,
      defenderInstanceId: defender.instanceId,
      defenderPosition: adj,
    });
  }
  return options;
}

interface AttackExecution {
  state: GameState;
  events: GameEvent[];
  combatCapture: { instanceId: string; captor: BoardCard["owner"] } | null;
}

function executeAttack(
  state: GameState,
  attackerInstanceId: string,
  direction: Direction,
  rng: Rng,
  chainDepth: number,
): AttackExecution {
  const events: GameEvent[] = [];
  if (!canResolveMore(state)) {
    return { state, events, combatCapture: null };
  }

  let nextState = incrementResolution(state);
  const attackerLocated = findCardById(nextState, attackerInstanceId);
  if (!attackerLocated) {
    return { state: nextState, events, combatCapture: null };
  }

  const adj = neighbor(attackerLocated.position, direction);
  if (!adj) return { state: nextState, events, combatCapture: null };

  const defenderLocated = findCardById(nextState, getCardAt(nextState, adj)?.instanceId ?? "");
  if (!defenderLocated) return { state: nextState, events, combatCapture: null };

  const attacker = attackerLocated.card;
  const defender = defenderLocated.card;

  if (!hasMutualArrow(attacker, defender, direction)) {
    return { state: nextState, events, combatCapture: null };
  }

  const result = resolveSingleAttack(attacker, defender, direction, nextState.config, rng);
  events.push(...result.events);

  nextState = updateBoardCard(nextState, defender.instanceId, {
    currentHp: result.defenderHp,
  });
  nextState = updateBoardCard(nextState, attacker.instanceId, {
    currentHp: result.attackerHp,
  });

  let combatCapture: AttackExecution["combatCapture"] = null;

  if (result.capturedInstanceId && result.captor !== null) {
    nextState = transferOwnership(
      nextState,
      result.capturedInstanceId,
      result.captor,
      nextState.config.captureSurvivorHp,
    );
    combatCapture = { instanceId: result.capturedInstanceId, captor: result.captor };
  }

  void chainDepth;
  return { state: nextState, events, combatCapture };
}

function resolveChainSubtree(
  state: GameState,
  capturedInstanceId: string,
  captor: BoardCard["owner"],
  rng: Rng,
  depth: number,
): { state: GameState; events: GameEvent[]; needsChoice: PendingChainChoice | null } {
  if (depth >= state.config.maxChainDepth) {
    return { state, events: [], needsChoice: null };
  }

  const options = getChainOptions(state, capturedInstanceId, captor);
  if (options.length === 0) {
    return { state, events: [], needsChoice: null };
  }

  if (options.length === 1) {
    const only = options[0]!;
    const attack = executeAttack(state, only.attackerInstanceId, only.direction, rng, depth);
    let nextState = attack.state;
    const events = [...attack.events];

    if (attack.combatCapture) {
      const sub = resolveChainSubtree(
        nextState,
        attack.combatCapture.instanceId,
        attack.combatCapture.captor,
        rng,
        depth + 1,
      );
      nextState = sub.state;
      events.push(...sub.events);
      if (sub.needsChoice) {
        return { state: nextState, events, needsChoice: sub.needsChoice };
      }
    }
    return { state: nextState, events, needsChoice: null };
  }

  return {
    state,
    events: [],
    needsChoice: {
      type: "chain_choice",
      captor,
      attackerInstanceId: capturedInstanceId,
      options,
    },
  };
}

function resolveInstantCaptures(
  state: GameState,
  placedInstanceId: string,
  captor: BoardCard["owner"],
  captureDirections: Direction[],
): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  let nextState = state;

  for (const direction of captureDirections) {
    const placed = findCardById(nextState, placedInstanceId);
    if (!placed) break;
    const adj = neighbor(placed.position, direction);
    if (!adj) continue;
    const defender = getCardAt(nextState, adj);
    if (!defender || defender.owner === captor) continue;
    if (hasMutualArrow(placed.card, defender, direction)) continue;

    events.push({
      type: "instant_capture",
      captor,
      capturedInstanceId: defender.instanceId,
      hp: defender.currentHp,
    });
    nextState = transferOwnership(
      nextState,
      defender.instanceId,
      captor,
      defender.currentHp,
    );
  }

  return { state: nextState, events };
}

function processResolutionQueue(
  state: GameState,
  rng: Rng,
): { state: GameState; events: GameEvent[]; needsChoice: PendingChainChoice | null } {
  let nextState = { ...state, resolutionQueue: [...state.resolutionQueue] };
  const events: GameEvent[] = [];

  while (nextState.resolutionQueue.length > 0) {
    const frame = nextState.resolutionQueue[0]!;
    const attack = executeAttack(
      nextState,
      frame.attackerInstanceId,
      frame.direction,
      rng,
      0,
    );
    nextState = attack.state;
    events.push(...attack.events);
    nextState = {
      ...nextState,
      resolutionQueue: nextState.resolutionQueue.slice(1),
    };

    if (attack.combatCapture) {
      const chain = resolveChainSubtree(
        nextState,
        attack.combatCapture.instanceId,
        attack.combatCapture.captor,
        rng,
        1,
      );
      nextState = chain.state;
      events.push(...chain.events);
      if (chain.needsChoice) {
        return { state: { ...nextState, pending: chain.needsChoice }, events, needsChoice: chain.needsChoice };
      }
    }

    if (!canResolveMore(nextState)) break;
  }

  return { state: { ...nextState, pending: null }, events, needsChoice: null };
}

export function applyPlacement(
  state: GameState,
  command: PlacementCommand,
  rng: Rng,
): ActionResult {
  if (state.status !== "active") {
    return { ok: false, state, events: [], error: "Game is finished" };
  }
  if (state.pending) {
    return { ok: false, state, events: [], error: "Resolve pending chain choice first" };
  }
  if (command.playerId !== state.currentPlayer) {
    return { ok: false, state, events: [], error: "Not this player's turn" };
  }

  const hand = state.hands[command.playerId];
  const handIndex = hand.findIndex((c) => c.instanceId === command.cardInstanceId);
  if (handIndex < 0) {
    return { ok: false, state, events: [], error: "Card not in hand" };
  }

  const handCard = hand[handIndex]!;
  const cell = state.grid[command.position.row]?.[command.position.col];
  if (cell) {
    return { ok: false, state, events: [], error: "Cell is occupied" };
  }

  const previewCard: BoardCard = {
    instanceId: handCard.instanceId,
    template: handCard.template,
    owner: command.playerId,
    currentHp: handCard.template.maxHp,
    position: command.position,
  };

  const analysis = analyzePlacement(state, previewCard, command.position);
  const modeError = validateModeChoice(analysis, command.mode);
  if (modeError) {
    return { ok: false, state, events: [], error: modeError };
  }

  const events: GameEvent[] = [];
  let nextState: GameState = {
    ...state,
    grid: setCardAt(cloneGrid(state.grid), command.position, previewCard),
    hands: {
      ...state.hands,
      [command.playerId]: hand.filter((_, i) => i !== handIndex),
    },
    placementsCount: {
      ...state.placementsCount,
      [command.playerId]: state.placementsCount[command.playerId] + 1,
    },
    placementResolutionCount: 0,
    resolutionQueue: [],
    pending: null,
  };

  events.push({
    type: "card_placed",
    playerId: command.playerId,
    instanceId: previewCard.instanceId,
    position: command.position,
  });

  if (command.mode === "capture") {
    const directions = analysis.captureTargets.map((t) => t.direction);
    const capture = resolveInstantCaptures(
      nextState,
      previewCard.instanceId,
      command.playerId,
      directions,
    );
    nextState = capture.state;
    events.push(...capture.events);
  } else if (command.mode === "attack") {
    const mutualDirections = new Set(analysis.mutualAttacks.map((m) => m.direction));
    const order = command.attackArrowOrder ?? [...mutualDirections];
    if (order.length !== mutualDirections.size) {
      return { ok: false, state, events: [], error: "attackArrowOrder must list every mutual arrow exactly once" };
    }
    for (const dir of order) {
      if (!mutualDirections.has(dir)) {
        return { ok: false, state, events: [], error: `Direction ${dir} is not a mutual attack` };
      }
    }

    const queue: ResolutionFrame[] = order.map((direction) => ({
      kind: "placement_arrow",
      attackerInstanceId: previewCard.instanceId,
      direction,
    }));

    nextState = { ...nextState, resolutionQueue: queue };
    const processed = processResolutionQueue(nextState, rng);
    nextState = processed.state;
    events.push(...processed.events);
    if (processed.needsChoice) {
      return { ok: true, state: nextState, events };
    }
  }

  return finishTurn(nextState, events);
}

export function applyChainChoice(
  state: GameState,
  command: ChainChoiceCommand,
  rng: Rng,
): ActionResult {
  if (!state.pending || state.pending.type !== "chain_choice") {
    return { ok: false, state, events: [], error: "No pending chain choice" };
  }
  if (command.playerId !== state.pending.captor) {
    return { ok: false, state, events: [], error: "Only the captor may choose the chain attack" };
  }

  const valid = state.pending.options.find(
    (o) =>
      o.attackerInstanceId === command.attackerInstanceId &&
      o.direction === command.direction,
  );
  if (!valid) {
    return { ok: false, state, events: [], error: "Invalid chain attack choice" };
  }

  let events: GameEvent[] = [];
  let nextState: GameState = { ...state, pending: null };

  const attack = executeAttack(
    nextState,
    command.attackerInstanceId,
    command.direction,
    rng,
    0,
  );
  nextState = attack.state;
  events.push(...attack.events);

  if (attack.combatCapture) {
    const chain = resolveChainSubtree(
      nextState,
      attack.combatCapture.instanceId,
      attack.combatCapture.captor,
      rng,
      1,
    );
    nextState = chain.state;
    events = [...events, ...chain.events];
    if (chain.needsChoice) {
      return { ok: true, state: { ...nextState, pending: chain.needsChoice }, events };
    }
  }

  if (nextState.resolutionQueue.length > 0) {
    const processed = processResolutionQueue(nextState, rng);
    nextState = processed.state;
    events = [...events, ...processed.events];
    if (processed.needsChoice) {
      return { ok: true, state: nextState, events };
    }
  }

  return finishTurn(nextState, events);
}

function finishTurn(state: GameState, events: GameEvent[]): ActionResult {
  let nextState = {
    ...state,
    pending: null,
    resolutionQueue: [],
    placementResolutionCount: 0,
  };

  const bothPlaced =
    nextState.placementsCount[0] >= nextState.config.cardsPerPlayer &&
    nextState.placementsCount[1] >= nextState.config.cardsPerPlayer;

  if (bothPlaced) {
    const winner = determineWinner(nextState);
    const scores = computeScores(nextState);
    nextState = {
      ...nextState,
      status: "finished",
      winner,
    };
    events = [
      ...events,
      { type: "game_over", winner, scores },
    ];
    return { ok: true, state: nextState, events };
  }

  const nextPlayer = opponent(nextState.currentPlayer);
  nextState = {
    ...nextState,
    currentPlayer: nextPlayer,
    turnNumber: nextState.turnNumber + 1,
  };
  events = [...events, { type: "turn_ended", nextPlayer }];
  return { ok: true, state: nextState, events };
}