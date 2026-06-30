import type { BoardCard, GameState, HandCard, PlayerId, Position } from "@magicalindustries/realm-clash-core";

export type DeckCardStatus = "in_hand" | "on_board" | "captured";

export interface DeckCardEntry {
  card: HandCard;
  status: DeckCardStatus;
  currentHp?: number;
  position?: Position;
}

export function cloneHandCards(cards: HandCard[]): HandCard[] {
  return cards.map((card) => ({ instanceId: card.instanceId, template: card.template }));
}

export function boardCardToHandCard(board: BoardCard): HandCard {
  return { instanceId: board.instanceId, template: board.template };
}

/** Opening hand + captures on board − cards lost to the opponent. */
export function computePlayerDeck(
  initialHand: HandCard[],
  state: GameState,
  playerId: PlayerId,
): DeckCardEntry[] {
  const initialIds = new Set(initialHand.map((card) => card.instanceId));
  const entries: DeckCardEntry[] = [];
  const seen = new Set<string>();

  for (const card of state.hands[playerId]) {
    if (!initialIds.has(card.instanceId)) continue;
    entries.push({ card, status: "in_hand" });
    seen.add(card.instanceId);
  }

  for (const row of state.grid) {
    for (const cell of row) {
      if (!cell || cell.owner !== playerId || seen.has(cell.instanceId)) continue;

      const card = boardCardToHandCard(cell);
      if (initialIds.has(cell.instanceId)) {
        entries.push({
          card,
          status: "on_board",
          currentHp: cell.currentHp,
          position: cell.position,
        });
      } else {
        entries.push({
          card,
          status: "captured",
          currentHp: cell.currentHp,
          position: cell.position,
        });
      }
      seen.add(cell.instanceId);
    }
  }

  const statusOrder: Record<DeckCardStatus, number> = {
    in_hand: 0,
    on_board: 1,
    captured: 2,
  };

  entries.sort((left, right) => {
    const byStatus = statusOrder[left.status] - statusOrder[right.status];
    if (byStatus !== 0) return byStatus;
    return left.card.template.name.localeCompare(right.card.template.name);
  });

  return entries;
}