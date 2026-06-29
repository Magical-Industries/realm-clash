import type { CollectionCardPreview } from "../types.js";

export const AFRICAN_SAVANNA_SET: CollectionCardPreview[] = [
  { name: "African Elephant", rarity: "legendary", meta: "HP 0x120 · 6 arrows", set: "African Savanna" },
  { name: "Cheetah", rarity: "rare", meta: "HP 0x0A0 · 4 arrows", set: "African Savanna" },
  { name: "Warthog", rarity: "uncommon", meta: "HP 0x080 · 3 arrows", set: "African Savanna" },
  { name: "Meerkat", rarity: "common", meta: "HP 0x050 · 2 arrows", set: "African Savanna" },
  { name: "Lion", rarity: "ultra", meta: "HP 0x100 · 5 arrows", set: "African Savanna" },
  { name: "Giraffe", rarity: "rare", meta: "HP 0x0B0 · 4 arrows", set: "African Savanna" },
];

export function getWildlifeCollectionPreview(): CollectionCardPreview[] {
  return AFRICAN_SAVANNA_SET;
}