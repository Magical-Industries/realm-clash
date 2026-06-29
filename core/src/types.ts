/** Compass direction on the 4×4 grid (clockwise from north). */
export type Direction = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PlayerId = 0 | 1;

export type PlacementMode = "capture" | "attack" | "none";

export type OwnershipMode = "casual" | "ranked" | "sandbox";

export type GameStatus = "active" | "finished";

export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "ultra"
  | "secret"
  | "legendary";

export type Element =
  | "savanna"
  | "jungle"
  | "ocean"
  | "mountain"
  | "wetland"
  | "desert";

export interface Position {
  row: number;
  col: number;
}

export interface Arrow {
  direction: Direction;
  attack: number;
  defense: number;
}

export interface CardTemplate {
  id: string;
  name: string;
  rarity: Rarity;
  maxHp: number;
  element?: Element;
  arrows: Arrow[];
}

/** Card in a player's hand before placement. */
export interface HandCard {
  instanceId: string;
  template: CardTemplate;
}

/** Card on the board during play. */
export interface BoardCard {
  instanceId: string;
  template: CardTemplate;
  owner: PlayerId;
  currentHp: number;
  position: Position;
}

export interface GameConfig {
  gridSize: 4;
  cardsPerPlayer: 5;
  maxChainDepth: number;
  maxResolutionsPerPlacement: number;
  elementBonusEnabled: boolean;
  ownershipMode: OwnershipMode;
  /** Post-combat capture HP (rules v2.0). */
  captureSurvivorHp: 1;
}

export interface PendingChainChoice {
  type: "chain_choice";
  captor: PlayerId;
  attackerInstanceId: string;
  options: ChainAttackOption[];
}

export interface GameState {
  config: GameConfig;
  grid: (BoardCard | null)[][];
  hands: Record<PlayerId, HandCard[]>;
  placementsCount: Record<PlayerId, number>;
  currentPlayer: PlayerId;
  turnNumber: number;
  status: GameStatus;
  winner: PlayerId | "draw" | null;
  /** Resolutions consumed during the current placement (combat + chains). */
  placementResolutionCount: number;
  /** When non-null, the active player must pick a chain attack before play continues. */
  pending: PendingChainChoice | null;
  /** Internal queue for depth-first chain resolution after a combat capture. */
  resolutionQueue: ResolutionFrame[];
}

/** One step in the depth-first chain / placement attack queue. */
export interface ResolutionFrame {
  kind: "placement_arrow" | "chain_attack";
  attackerInstanceId: string;
  direction: Direction;
}

export interface ChainAttackOption {
  attackerInstanceId: string;
  direction: Direction;
  defenderInstanceId: string;
  defenderPosition: Position;
}

export interface PlacementAnalysis {
  position: Position;
  availableModes: PlacementMode[];
  /** Undefended capture opportunities (capture mode). */
  captureTargets: CaptureTarget[];
  /** Mutual-arrow attacks available (attack mode). */
  mutualAttacks: MutualAttack[];
}

export interface CaptureTarget {
  direction: Direction;
  defenderInstanceId: string;
  defenderPosition: Position;
}

export interface MutualAttack {
  direction: Direction;
  defenderInstanceId: string;
  defenderPosition: Position;
  attackValue: number;
  defenseValue: number;
}

export interface PlacementCommand {
  playerId: PlayerId;
  cardInstanceId: string;
  position: Position;
  mode: PlacementMode;
  /** Required for attack mode — order of mutual arrows on the placed card. */
  attackArrowOrder?: Direction[];
}

export interface ChainChoiceCommand {
  playerId: PlayerId;
  attackerInstanceId: string;
  direction: Direction;
}

export type GameEvent =
  | { type: "card_placed"; playerId: PlayerId; instanceId: string; position: Position }
  | { type: "instant_capture"; captor: PlayerId; capturedInstanceId: string; hp: number }
  | {
      type: "attack_compare";
      attackerInstanceId: string;
      defenderInstanceId: string;
      direction: Direction;
      attackValue: number;
      defenseValue: number;
      outcome: "attacker_wins" | "defender_wins" | "tie";
    }
  | {
      type: "damage";
      targetInstanceId: string;
      amount: number;
      source: "hit" | "counter";
      roll: number;
    }
  | {
      type: "combat_capture";
      captor: PlayerId;
      capturedInstanceId: string;
      survivorHp: number;
    }
  | { type: "turn_ended"; nextPlayer: PlayerId }
  | { type: "game_over"; winner: PlayerId | "draw"; scores: ScoreSummary };

export interface ScoreSummary {
  hpTotals: Record<PlayerId, number>;
  cardCounts: Record<PlayerId, number>;
  rarityTotals: Record<PlayerId, number>;
}

export interface ActionResult {
  ok: boolean;
  state: GameState;
  events: GameEvent[];
  error?: string;
}

export interface Rng {
  /** Returns an integer in [1, sides] inclusive. */
  rollDie(sides: number): number;
}