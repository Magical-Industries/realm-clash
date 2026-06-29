import {
  analyzePlacementForHandCard,
  applyChainChoice,
  applyPlacement,
  computeScores,
  createGame,
  getAvailableModes,
  type ChainChoiceCommand,
  type Direction,
  type GameEvent,
  type GameState,
  type HandCard,
  type PlacementCommand,
  type PlacementMode,
  type PlayerId,
  type Position,
  RandomRng,
  type Rng,
} from "@magicalindustries/realm-clash-core";

import { createDemoHands } from "./demo-deck.js";

export type UiPhase =
  | "select_card"
  | "select_cell"
  | "select_mode"
  | "select_chain"
  | "game_over";

export interface ControllerSnapshot {
  state: GameState;
  phase: UiPhase;
  selectedCardId: string | null;
  selectedPosition: Position | null;
  availableModes: PlacementMode[];
  mutualDirections: Direction[];
  eventLog: string[];
}

export class GameController {
  private state: GameState;
  private rng: Rng;
  private phase: UiPhase = "select_card";
  private selectedCardId: string | null = null;
  private selectedPosition: Position | null = null;
  private availableModes: PlacementMode[] = ["none"];
  private mutualDirections: Direction[] = [];
  private eventLog: string[] = [];

  constructor(rng: Rng = new RandomRng()) {
    this.rng = rng;
    this.state = this.createFreshGame();
    this.pushSystem("New hot-seat match started.");
  }

  getSnapshot(): ControllerSnapshot {
    return {
      state: this.state,
      phase: this.phase,
      selectedCardId: this.selectedCardId,
      selectedPosition: this.selectedPosition,
      availableModes: this.availableModes,
      mutualDirections: this.mutualDirections,
      eventLog: [...this.eventLog],
    };
  }

  resetMatch(): void {
    this.rng = new RandomRng();
    this.state = this.createFreshGame();
    this.selectedCardId = null;
    this.selectedPosition = null;
    this.availableModes = ["none"];
    this.mutualDirections = [];
    this.eventLog = [];
    this.phase = "select_card";
    this.pushSystem("New hot-seat match started.");
  }

  selectCard(instanceId: string): void {
    if (this.phase === "game_over" || this.state.pending) return;
    if (this.phase !== "select_card" && this.phase !== "select_cell") return;
    const hand = this.state.hands[this.state.currentPlayer];
    if (!hand.some((c) => c.instanceId === instanceId)) return;

    this.selectedCardId = instanceId;
    this.selectedPosition = null;
    this.phase = "select_cell";
    this.availableModes = ["none"];
    this.mutualDirections = [];
  }

  /** Select a hand card and target cell in one gesture (e.g. drag-and-drop). */
  placeFromHand(instanceId: string, position: Position): void {
    if (this.phase === "game_over" || this.state.pending) return;
    if (this.phase !== "select_card" && this.phase !== "select_cell") return;

    this.selectCard(instanceId);
    if (this.phase === "select_cell") {
      this.selectCell(position);
    }
  }

  selectCell(position: Position): void {
    if (this.phase !== "select_cell" || !this.selectedCardId || this.state.pending) {
      return;
    }

    const analysis = analyzePlacementForHandCard(
      this.state,
      this.state.currentPlayer,
      this.selectedCardId,
      position,
    );
    if (!analysis) {
      this.pushSystem("Invalid placement for this card.");
      return;
    }

    this.selectedPosition = position;
    this.availableModes = getAvailableModes(analysis);
    this.mutualDirections = analysis.mutualAttacks.map((m) => m.direction);

    const choosable = this.availableModes.filter((m) => m !== "none");
    if (choosable.length === 0) {
      this.commitPlacement("none");
      return;
    }
    if (choosable.length === 1) {
      this.commitPlacement(choosable[0]!);
      return;
    }

    this.phase = "select_mode";
  }

  chooseMode(mode: PlacementMode): void {
    if (this.phase !== "select_mode") return;
    this.commitPlacement(mode);
  }

  chooseChain(command: Omit<ChainChoiceCommand, "playerId">): void {
    if (this.phase !== "select_chain" || !this.state.pending) return;

    const result = applyChainChoice(
      this.state,
      { ...command, playerId: this.state.currentPlayer },
      this.rng,
    );

    if (!result.ok) {
      this.pushSystem(result.error ?? "Chain choice failed.");
      return;
    }

    this.state = result.state;
    this.appendEvents(result.events);
    this.afterEngineStep();
  }

  private commitPlacement(mode: PlacementMode): void {
    if (!this.selectedCardId || !this.selectedPosition) return;

    const command: PlacementCommand = {
      playerId: this.state.currentPlayer,
      cardInstanceId: this.selectedCardId,
      position: this.selectedPosition,
      mode,
    };

    if (mode === "attack") {
      command.attackArrowOrder = [...this.mutualDirections].sort((a, b) => a - b);
    }

    const result = applyPlacement(this.state, command, this.rng);
    if (!result.ok) {
      this.pushSystem(result.error ?? "Placement failed.");
      return;
    }

    this.state = result.state;
    this.appendEvents(result.events);
    this.afterEngineStep();
  }

  private afterEngineStep(): void {
    if (this.state.pending) {
      this.phase = "select_chain";
      this.pushSystem("Choose a chain attack.");
      return;
    }

    this.selectedCardId = null;
    this.selectedPosition = null;
    this.availableModes = ["none"];
    this.mutualDirections = [];

    if (this.state.status === "finished") {
      this.phase = "game_over";
      return;
    }

    this.phase = "select_card";
  }

  private createFreshGame(): GameState {
    const { player0, player1 } = createDemoHands();
    return createGame({
      player0Hand: player0,
      player1Hand: player1,
      config: { elementBonusEnabled: true },
    });
  }

  private appendEvents(events: GameEvent[]): void {
    for (const event of events) {
      this.eventLog.unshift(this.formatEvent(event));
    }
    if (this.eventLog.length > 80) {
      this.eventLog.length = 80;
    }
  }

  private pushSystem(message: string): void {
    this.eventLog.unshift(message);
    if (this.eventLog.length > 80) {
      this.eventLog.length = 80;
    }
  }

  private formatEvent(event: GameEvent): string {
    switch (event.type) {
      case "card_placed":
        return `P${event.playerId + 1} placed ${event.instanceId} at (${event.position.row},${event.position.col}).`;
      case "instant_capture":
        return `P${event.captor + 1} instantly captured ${event.capturedInstanceId} (HP ${event.hp}).`;
      case "attack_compare":
        return `Attack ${event.attackValue} vs Defense ${event.defenseValue} → ${event.outcome}.`;
      case "damage":
        return `${event.targetInstanceId} took ${event.amount} ${event.source} damage (d6=${event.roll}).`;
      case "combat_capture":
        return `P${event.captor + 1} captured ${event.capturedInstanceId} at ${event.survivorHp} HP.`;
      case "turn_ended":
        return `Turn ended. P${event.nextPlayer + 1} to play.`;
      case "game_over": {
        const winner =
          event.winner === "draw" ? "Draw" : `Player ${event.winner + 1}`;
        return `Game over — ${winner} wins (HP ${event.scores.hpTotals[0]} vs ${event.scores.hpTotals[1]}).`;
      }
      default:
        return JSON.stringify(event);
    }
  }
}

export function formatHandCard(card: HandCard): string {
  const arrows = card.template.arrows
    .map((a) => `D${a.direction}:${a.attack}/${a.defense}`)
    .join(" ");
  return `${card.template.name} · HP ${card.template.maxHp.toString(16).toUpperCase()} · ${arrows}`;
}

export function playerLabel(id: PlayerId): string {
  return `Player ${id + 1}`;
}

export function liveScores(state: GameState): string {
  const scores = computeScores(state);
  return `P1 HP ${scores.hpTotals[0]} (${scores.cardCounts[0]} cards) · P2 HP ${scores.hpTotals[1]} (${scores.cardCounts[1]} cards)`;
}