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
  type MutualAttack,
  type PlacementCommand,
  type PlacementMode,
  type PlayerId,
  type Position,
  RandomRng,
  type Rng,
} from "@magicalindustries/realm-clash-core";

import {
  pickComputerAttackOrder,
  pickComputerChain,
  pickComputerPlacement,
} from "./ai/computer-player.js";
import {
  cloneHandCards,
  computePlayerDeck,
  type DeckCardEntry,
} from "./match/deck-tracker.js";
import { type Difficulty, difficultyLabel } from "./match/difficulty.js";
import type { MatchMode } from "./match/types.js";
import { DEFAULT_REALM_ID, requireRealm } from "./realms/index.js";

export type { MatchMode } from "./match/types.js";

export type UiPhase =
  | "select_card"
  | "select_cell"
  | "select_mode"
  | "select_attack_order"
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
  mutualAttacks: MutualAttack[];
  attackArrowOrder: Direction[];
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
  private mutualAttacks: MutualAttack[] = [];
  private attackArrowOrder: Direction[] = [];
  private initialHands: Record<PlayerId, HandCard[]> = { 0: [], 1: [] };

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
      mutualAttacks: [...this.mutualAttacks],
      attackArrowOrder: [...this.attackArrowOrder],
      eventLog: [...this.eventLog],
    };
  }

  isComputerPlayer(playerId: PlayerId): boolean {
    return this.matchMode === "cpu" && playerId === CPU_PLAYER;
  }

  /** Live roster: opening hand + captures − cards lost to the opponent. */
  getPlayerDeck(playerId: PlayerId): DeckCardEntry[] {
    return computePlayerDeck(this.initialHands[playerId], this.state, playerId);
  }

  isComputerTurn(): boolean {
    if (this.matchMode !== "cpu" || this.state.status !== "active" || this.phase === "game_over") {
      return false;
    }

    if (this.phase === "select_chain" && this.state.pending) {
      return this.isComputerPlayer(this.state.pending.captor);
    }

    return this.isComputerPlayer(this.state.currentPlayer) && !this.state.pending;
  }

  /** Redeal hands before the match starts (empty board only). */
  reshuffleDealtHands(): boolean {
    if (this.state.status !== "active" || this.state.pending) return false;
    const boardEmpty = this.state.grid.every((row) => row.every((cell) => cell === null));
    if (!boardEmpty) return false;

    const realm = requireRealm(this.realmId);
    const { player0, player1 } = realm.createMatchHands({
      mode: this.matchMode,
      difficulty: this.difficulty,
      rng: this.rng,
    });
    this.state = { ...this.state, hands: [player0, player1] };
    this.snapshotInitialHands();
    return true;
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
    this.mutualAttacks = [];
    this.attackArrowOrder = [];
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
        const captor = this.state.pending.captor;
        const chain = pickComputerChain(this.state, captor, this.rng);
        if (!chain) break;
        this.chooseChain(chain);
        continue;
      }

      if (this.phase === "select_attack_order") {
        const order = pickComputerAttackOrder(this.mutualAttacks, this.rng);
        this.setAttackArrowOrder(order);
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
    this.mutualAttacks = [];
    this.attackArrowOrder = [];
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
    this.mutualAttacks = analysis.mutualAttacks;
    this.mutualDirections = analysis.mutualAttacks.map((m) => m.direction);
    this.attackArrowOrder = [];

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
    if (mode === "attack" && this.mutualAttacks.length > 1) {
      this.attackArrowOrder = [];
      this.phase = "select_attack_order";
      return;
    }
    this.commitPlacement(mode);
  }

  pickAttackTarget(direction: Direction): void {
    if (this.phase !== "select_attack_order") return;
    if (!this.mutualDirections.includes(direction)) return;
    if (this.attackArrowOrder.includes(direction)) return;

    this.attackArrowOrder.push(direction);
    if (this.attackArrowOrder.length === this.mutualDirections.length) {
      this.commitPlacement("attack");
    }
  }

  undoLastAttackTarget(): void {
    if (this.phase !== "select_attack_order") return;
    this.attackArrowOrder.pop();
  }

  private setAttackArrowOrder(order: Direction[]): void {
    if (this.phase !== "select_attack_order") return;
    this.attackArrowOrder = [...order];
    this.commitPlacement("attack");
  }

  chooseChain(command: Omit<ChainChoiceCommand, "playerId">): void {
    if (this.phase !== "select_chain" || !this.state.pending) return;

    const result = applyChainChoice(
      this.state,
      { ...command, playerId: this.state.pending.captor },
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
      command.attackArrowOrder =
        this.attackArrowOrder.length > 0
          ? [...this.attackArrowOrder]
          : [...this.mutualDirections];
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
      const actor = playerLabel(this.state.pending.captor, this.matchMode);
      this.pushSystem(`${actor} — resolve chain.`);
      return;
    }

    this.selectedCardId = null;
    this.selectedPosition = null;
    this.availableModes = ["none"];
    this.mutualDirections = [];
    this.mutualAttacks = [];
    this.attackArrowOrder = [];

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
    const state = createGame({
      player0Hand: player0,
      player1Hand: player1,
      config: { elementBonusEnabled: true },
      startingPlayer: this.matchMode === "cpu" ? HUMAN_PLAYER : CPU_PLAYER,
    });
    this.snapshotInitialHandsFrom(state);
    return state;
  }

  private snapshotInitialHands(): void {
    this.snapshotInitialHandsFrom(this.state);
  }

  private snapshotInitialHandsFrom(state: GameState): void {
    this.initialHands = {
      0: cloneHandCards(state.hands[0]),
      1: cloneHandCards(state.hands[1]),
    };
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