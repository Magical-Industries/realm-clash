import { RARITY_VALUE } from "./constants.js";
import { cardsOnBoardForPlayer } from "./grid.js";
import type { GameState, PlayerId, ScoreSummary } from "./types.js";

export function computeScores(state: GameState): ScoreSummary {
  const hpTotals: Record<PlayerId, number> = { 0: 0, 1: 0 };
  const cardCounts: Record<PlayerId, number> = { 0: 0, 1: 0 };
  const rarityTotals: Record<PlayerId, number> = { 0: 0, 1: 0 };

  for (const player of [0, 1] as const) {
    const cards = cardsOnBoardForPlayer(state, player);
    cardCounts[player] = cards.length;
    for (const card of cards) {
      hpTotals[player] += card.currentHp;
      rarityTotals[player] += RARITY_VALUE[card.template.rarity];
    }
  }

  return { hpTotals, cardCounts, rarityTotals };
}

export function determineWinner(state: GameState): PlayerId | "draw" {
  const scores = computeScores(state);
  const hp0 = scores.hpTotals[0];
  const hp1 = scores.hpTotals[1];

  if (hp0 > hp1) return 0;
  if (hp1 > hp0) return 1;

  if (scores.cardCounts[0] > scores.cardCounts[1]) return 0;
  if (scores.cardCounts[1] > scores.cardCounts[0]) return 1;

  if (scores.rarityTotals[0] > scores.rarityTotals[1]) return 0;
  if (scores.rarityTotals[1] > scores.rarityTotals[0]) return 1;

  return "draw";
}