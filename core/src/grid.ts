import { DIRECTION_DELTA, GRID_SIZE, OPPOSITE_DIRECTION } from "./constants.js";
import type { BoardCard, Direction, GameState, Position } from "./types.js";

export function isInBounds({ row, col }: Position): boolean {
  return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}

export function neighbor(position: Position, direction: Direction): Position | null {
  const delta = DIRECTION_DELTA[direction];
  if (!delta) return null;
  const next = { row: position.row + delta[0], col: position.col + delta[1] };
  return isInBounds(next) ? next : null;
}

export function getCardAt(state: GameState, position: Position): BoardCard | null {
  if (!isInBounds(position)) return null;
  return state.grid[position.row]?.[position.col] ?? null;
}

export function setCardAt(
  grid: (BoardCard | null)[][],
  position: Position,
  card: BoardCard | null,
): (BoardCard | null)[][] {
  return grid.map((row, rowIndex) =>
    rowIndex === position.row
      ? row.map((cell, colIndex) => (colIndex === position.col ? card : cell))
      : row,
  );
}

export function findCardById(
  state: GameState,
  instanceId: string,
): { card: BoardCard; position: Position } | null {
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const card = state.grid[row]?.[col];
      if (card?.instanceId === instanceId) {
        return { card, position: { row, col } };
      }
    }
  }
  return null;
}

export function emptyCells(state: GameState): Position[] {
  const cells: Position[] = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (!state.grid[row]?.[col]) cells.push({ row, col });
    }
  }
  return cells;
}

export function getArrow(card: BoardCard, direction: Direction) {
  return card.template.arrows.find((arrow) => arrow.direction === direction) ?? null;
}

export function hasMutualArrow(
  attacker: BoardCard,
  defender: BoardCard,
  direction: Direction,
): boolean {
  const opposite = OPPOSITE_DIRECTION[direction] as Direction;
  return (
    getArrow(attacker, direction) !== null &&
    getArrow(defender, opposite) !== null
  );
}

export function cardsOnBoardForPlayer(state: GameState, playerId: number): BoardCard[] {
  const cards: BoardCard[] = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const card = state.grid[row]?.[col];
      if (card && card.owner === playerId) cards.push(card);
    }
  }
  return cards;
}

export function cloneGrid(grid: (BoardCard | null)[][]): (BoardCard | null)[][] {
  return grid.map((row) => row.map((cell) => (cell ? { ...cell, position: { ...cell.position } } : null)));
}