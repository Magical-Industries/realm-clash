import type { Element, HandCard, Rarity, Rng } from "@magicalindustries/realm-clash-core";

import type { Difficulty } from "../match/difficulty.js";
import type { MatchMode } from "../match/types.js";

export interface MatchHandsOptions {
  mode: MatchMode;
  difficulty: Difficulty;
  rng: Rng;
}

export type RealmStatus = "live" | "coming-soon";

export interface CollectionCardPreview {
  name: string;
  rarity: Rarity;
  meta: string;
  set?: string;
}

export interface CreatorDefaults {
  placeholderName: string;
  placeholderHp: string;
  elements: { value: Element; label: string }[];
  rarityOptions: { value: Rarity; label: string }[];
  notesPlaceholder: string;
}

export interface RealmDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  status: RealmStatus;
  /** Primary biome element used when generating cards in this realm. */
  defaultElement: Element;
  createMatchHands: (options: MatchHandsOptions) => { player0: HandCard[]; player1: HandCard[] };
  getCollectionPreview: () => CollectionCardPreview[];
  getCreatorDefaults: () => CreatorDefaults;
}