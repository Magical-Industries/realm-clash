import { GRID_SIZE } from "@magicalindustries/realm-clash-core";

/** Vertical space reserved for each player's hand strip (cards + padding + label). */
export const HAND_STRIP_HEIGHT = 92;

export interface ArenaInsets {
  top: number;
  bottom: number;
}

export interface GridLayout {
  offsetX: number;
  offsetY: number;
  cellSize: number;
}

export function computeArenaInsets(): ArenaInsets {
  return { top: HAND_STRIP_HEIGHT, bottom: HAND_STRIP_HEIGHT };
}

export function computeGridLayout(
  width: number,
  height: number,
  insets: ArenaInsets,
): GridLayout {
  const boardWidth = width;
  const boardHeight = height - insets.top - insets.bottom;
  const gridSpan = Math.min(boardWidth, Math.max(boardHeight, 0));
  const cellSize = gridSpan / (GRID_SIZE + 0.15);
  const gridPixelSize = cellSize * GRID_SIZE;
  const offsetX = (boardWidth - gridPixelSize) / 2;
  const offsetY = insets.top + (boardHeight - gridPixelSize) / 2;

  return { offsetX, offsetY, cellSize };
}