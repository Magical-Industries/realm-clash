import type { Rarity } from "@magicalindustries/realm-clash-core";

/** Parse #RRGGBB to Pixi numeric color. */
export function hexToPixi(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}

/** Design tokens mirrored from design-tokens.css for Pixi/canvas rendering. */
export const theme = {
  bg: {
    primary: "#0A0A0F",
    secondary: "#12121A",
    card: "#1C1C28",
    cellEmpty: "#1C1C28",
    cellFilled: "#161622",
  },
  text: {
    primary: "#F5F5F8",
    secondary: "#A0A0B0",
    muted: "#6B6B7A",
  },
  border: "#2A2A38",
  primary: "#00E5C0",
  secondary: "#FF4D94",
  accentGold: "#FFCC33",
  success: "#22FF99",
  danger: "#FF3B5C",
  warning: "#FFB800",
  player: {
    0: "#00E5C0",
    1: "#FF4D94",
  },
  rarity: {
    common: "#A0A0B0",
    uncommon: "#22FF99",
    rare: "#00E5C0",
    ultra: "#FF4D94",
    secret: "#B388FF",
    legendary: "#FFD700",
  },
  pixi: {
    bgPrimary: hexToPixi("#0A0A0F"),
    bgCard: hexToPixi("#1C1C28"),
    bgCellEmpty: hexToPixi("#1C1C28"),
    bgCellFilled: hexToPixi("#161622"),
    border: hexToPixi("#2A2A38"),
    primary: hexToPixi("#00E5C0"),
    secondary: hexToPixi("#FF4D94"),
    textPrimary: hexToPixi("#F5F5F8"),
    textSecondary: hexToPixi("#A0A0B0"),
    textMuted: hexToPixi("#6B6B7A"),
    arrow: hexToPixi("#FFCC33"),
    player0: hexToPixi("#00E5C0"),
    player1: hexToPixi("#FF4D94"),
    highlight: hexToPixi("#00E5C0"),
  },
} as const;

export function rarityColor(rarity: Rarity): string {
  return theme.rarity[rarity];
}

export function rarityPixi(rarity: Rarity): number {
  return hexToPixi(theme.rarity[rarity]);
}

export function playerPixi(playerId: 0 | 1): number {
  return theme.pixi[playerId === 0 ? "player0" : "player1"];
}