import { getArrow, getCardAt, hasMutualArrow, neighbor } from "./grid.js";
import type {
  BoardCard,
  CaptureTarget,
  Direction,
  GameState,
  MutualAttack,
  PlacementAnalysis,
  PlacementMode,
  Position,
} from "./types.js";

function analyzeAtPosition(
  state: GameState,
  placedCard: BoardCard,
  position: Position,
): PlacementAnalysis {
  const captureTargets: CaptureTarget[] = [];
  const mutualAttacks: MutualAttack[] = [];

  for (const arrow of placedCard.template.arrows) {
    const adj = neighbor(position, arrow.direction);
    if (!adj) continue;
    const defender = getCardAt(state, adj);
    if (!defender || defender.owner === placedCard.owner) continue;

    if (hasMutualArrow(placedCard, defender, arrow.direction)) {
      const opposite = ((arrow.direction + 4) % 8) as Direction;
      const defenseArrow = getArrow(defender, opposite);
      mutualAttacks.push({
        direction: arrow.direction,
        defenderInstanceId: defender.instanceId,
        defenderPosition: adj,
        attackValue: arrow.attack,
        defenseValue: defenseArrow?.defense ?? 0,
      });
    } else {
      captureTargets.push({
        direction: arrow.direction,
        defenderInstanceId: defender.instanceId,
        defenderPosition: adj,
      });
    }
  }

  const availableModes: PlacementMode[] = [];
  if (captureTargets.length > 0) availableModes.push("capture");
  if (mutualAttacks.length > 0) availableModes.push("attack");
  if (availableModes.length === 0) availableModes.push("none");

  return { position, availableModes, captureTargets, mutualAttacks };
}

export function analyzePlacement(
  state: GameState,
  placedCard: BoardCard,
  position: Position,
): PlacementAnalysis {
  return analyzeAtPosition(state, placedCard, position);
}

export function getAvailableModes(analysis: PlacementAnalysis): PlacementMode[] {
  if (
    analysis.availableModes.includes("capture") &&
    analysis.availableModes.includes("attack")
  ) {
    return ["capture", "attack"];
  }
  return [...analysis.availableModes];
}

export function validateModeChoice(
  analysis: PlacementAnalysis,
  mode: PlacementMode,
): string | null {
  const modes = getAvailableModes(analysis);
  if (mode === "none") {
    return modes.includes("none") ? null : "Must choose capture or attack mode";
  }
  if (!modes.includes(mode)) {
    return `Mode "${mode}" is not available at this position`;
  }
  return null;
}