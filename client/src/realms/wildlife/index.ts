import type { RealmDefinition } from "../types.js";
import { getWildlifeCollectionPreview } from "./collection.js";
import { getWildlifeCreatorDefaults } from "./creator.js";
import { createWildlifeMatchHands } from "./demo-deck.js";

export const wildlifeRealm: RealmDefinition = {
  id: "wildlife",
  name: "Wildlife",
  tagline: "African Savanna & beyond",
  description:
    "Collect and battle animals from the Wildlife Realms line — starting with the 162-card African Savanna set.",
  status: "live",
  defaultElement: "savanna",
  createMatchHands: createWildlifeMatchHands,
  getCollectionPreview: getWildlifeCollectionPreview,
  getCreatorDefaults: getWildlifeCreatorDefaults,
};