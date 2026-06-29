import type { CreatorDefaults } from "../types.js";

export function getWildlifeCreatorDefaults(): CreatorDefaults {
  return {
    placeholderName: "e.g. Savanna Stalker",
    placeholderHp: "0x080",
    elements: [
      { value: "savanna", label: "Savanna" },
      { value: "jungle", label: "Jungle" },
      { value: "wetland", label: "Wetland" },
      { value: "desert", label: "Desert" },
    ],
    rarityOptions: [
      { value: "common", label: "Common" },
      { value: "uncommon", label: "Uncommon" },
      { value: "rare", label: "Rare" },
      { value: "ultra", label: "Ultra" },
      { value: "legendary", label: "Legendary" },
    ],
    notesPlaceholder: "Arrow layout, savanna biome tag, special ability…",
  };
}