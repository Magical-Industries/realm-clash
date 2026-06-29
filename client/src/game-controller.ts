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

import { pickComputerChain, pickComputerPlacement } from "./ai/computer-player.js";
import { type Difficulty, difficultyLabel } from "./match/difficulty.js";
import type { MatchMode } from "./match/types.js";
import { DEFAULT_REALM_ID, requireRealm } from "./realms/index.js";

export type { MatchMode } from "./match/types.js";

export type UiPhase =
  | "select_card"
  | "select_cell"
  | "select_mode"
  | "select_chain"
  | "game_over";

export interface MatchConfig {
  mode?: MatchMode;
  realmId?: string;
  difficulty?: Difficulty;
}

export interface ControllerSnapshot {
  state: GameState;
  phase: UiPhase;
  matchMode: MatchMode;
  realmId: string;
  difficulty: Difficulty;
  humanPlayer: PlayerId;
  selectedCardId: string | null;
  selectedPosition: Position | null;
  availableModes: PlacementMode[];
  mutualDirections: Direction[];
  eventLog: string[];
}

const CPU_PLAYER: PlayerId = 0;
const HUMAN_PLAYER: PlayerId = 1;

export class GameController {
  private state: GameState;
  private rng: Rng;
  private matchMode: MatchMode;
  private realmId: string;
  private difficulty: Difficulty;
  private humanPlayer: PlayerId;
  private phase: UiPhase = "select_card";
  private selectedCardId: string | null = null;
  private selectedPosition: Position | null = null;
  private availableModes: PlacementMode[] = ["none"];
  private mutualDirections: Direction[] = [];

  private eventLog: string[] = [];

  constructor(config: MatchConfig = {}, rng: Rng = new RandomRng()) {
    this.matchMode = config.mode ?? "pvp";
    this.realmId = config.realmId ?? DEFAULT_REALM_ID;
    this.difficulty = config.difficulty ?? "medium";
    this.humanPlayer = HUMAN_PLAYER;
    this.rng = rng;
    this.state = this.createFreshGame();
    this.pushSystem(this.openingMessage());
  }

  getSnapshot(): ControllerSnapshot {
    return {
      state: this.state,
      phase: this.phase,
      matchMode: this.matchMode,
      realmId: this.realmId,
      difficulty: this.difficulty,
      humanPlayer: this.humanPlayer,
      selectedCardId: this.selectedCardId,
      selectedPosition: this.selectedPosition,
      availableModes: this.availableModes,
      mutualDirections: this.mutualDirections,
      eventLog: [...this.eventLog],
    };
  }

  isComputerPlayer(playerId: PlayerId): boolean {
    return this.matchMode === "cpu" && playerId === CPU_PLAYER;
  }

  isComputerTurn(): boolean {
    return (
      this.matchMode === "cpu" &&
      this.state.status === "active" &&
      this.isComputerPlayer(this.state.currentPlayer) &&
      this.phase !== "game_over"
    );
  }

  resetMatch(config: MatchConfig = {}): void {
    if (config.mode) this.matchMode = config.mode;
    if (config.realmId) this.realmId = config.realmId;
    if (config.difficulty) this.difficulty = config.difficulty;
    this.humanPlayer = HUMAN_PLAYER;

    this.rng = new RandomRng();
    this.state = this.createFreshGame();
    this.selectedCardId = null;
    this.selectedPosition = null;
    this.availableModes = ["none"];
    this.mutualDirections = [];
    this.eventLog = [];
    this.phase = "select_card";
    this.pushSystem(this.openingMessage());
  }

  /** Run the computer's turn using only public game state (board + its own hand). */
  runComputerTurn(): void {
    if (!this.isComputerTurn()) return;

    let guard = 0;
    while (guard++ < 24 && this.isComputerTurn()) {
      if (this.phase === "select_chain" && this.state.pending) {
        const chain = pickComputerChain(this.state, CPU_PLAYER);
        if (!chain) break;
        this.chooseChain(chain);
        continue;
      }

      if (this.phase === "select_mode") {
        const mode = this.availableModes.find((m) => m === "attack")
          ?? this.availableModes.find((m) => m === "capture")
          ?? this.availableModes[0];
        if (!mode) break;
        this.chooseMode(mode);
        continue;
      }

      if (this.phase === "select_card" || this.phase === "select_cell") {
        const placement = pickComputerPlacement(this.state, CPU_PLAYER);
        if (!placement) break;
        this.applySelectCard(placement.cardInstanceId);
        if (this.phase === "select_cell") {
          this.applySelectCell(placement.position);
        }
        if (this.phase === "select_mode") {
          this.chooseMode(placement.mode);
        }
        continue;
      }

      break;
    }
  }

  selectCard(instanceId: string): void {
    if (this.isComputerPlayer(this.state.currentPlayer)) return;
    this.applySelectCard(instanceId);
  }

  placeFromHand(instanceId: string, position: Position): void {
    if (this.isComputerPlayer(this.state.currentPlayer)) return;
    this.applySelectCard(instanceId);
    if (this.phase === "select_cell") {
      this.applySelectCell(position);
    }
  }

  selectCell(position: Position): void {
    if (this.isComputerPlayer(this.state.currentPlayer)) return;
    this.applySelectCell(position);
  }

  private applySelectCard(instanceId: string): void {
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

  private applySelectCell(position: Position): void {
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
      const actor = playerLabel(this.state.currentPlayer, this.matchMode);
      this.pushSystem(`${actor} — resolve chain.`);
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
    const realm = requireRealm(this.realmId);
    const { player0, player1 } = realm.createMatchHands({
      mode: this.matchMode,
      difficulty: this.difficulty,
      rng: this.rng,
    });
    return createGame({
      player0Hand: player0,
      player1Hand: player1,
      config: { elementBonusEnabled: true },
      startingPlayer: this.matchMode === "cpu" ? HUMAN_PLAYER : CPU_PLAYER,
    });
  }

  private openingMessage(): string {
    const realm = requireRealm(this.realmId);
    if (this.matchMode === "cpu") {
      return `New match — ${realm.name} · ${difficultyLabel(this.difficulty)} vs Computer.`;
    }
    return `New hot-seat match — ${realm.name} realm.`;
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
        return `${playerLabel(event.playerId, this.matchMode)} placed ${event.instanceId} at (${event.position.row},${event.position.col}).`;
      case "instant_capture":
        return `${playerLabel(event.captor, this.matchMode)} instantly captured ${event.capturedInstanceId} (HP ${event.hp}).`;
      case "attack_compare":
        return `Attack ${event.attackValue} vs Defense ${event.defenseValue} → ${event.outcome}.`;
      case "damage":
        return `${event.targetInstanceId} took ${event.amount} ${event.source} damage (d6=${event.roll}).`;
      case "combat_capture":
        return `${playerLabel(event.captor, this.matchMode)} captured ${event.capturedInstanceId} at ${event.survivorHp} HP.`;
      case "turn_ended":
        return `Turn ended. ${playerLabel(event.nextPlayer, this.matchMode)} to play.`;
      case "game_over": {
        const winner =
          event.winner === "draw"
            ? "Draw"
            : playerLabel(event.winner as PlayerId, this.matchMode);
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

export function playerLabel(id: PlayerId, mode: MatchMode = "pvp"): string {
  if (mode === "cpu") {
    return id === CPU_PLAYER ? "Computer" : "You";
  }
  return `Player ${id + 1}`;
}

export function liveScores(state: GameState, mode: MatchMode = "pvp"): string {
  const scores = computeScores(state);
  const p0 = playerLabel(0, mode);
  const p1 = playerLabel(1, mode);
  return `${p0} HP ${scores.hpTotals[0]} (${scores.cardCounts[0]} cards) · ${p1} HP ${scores.hpTotals[1]} (${scores.cardCounts[1]} cards)`;
}