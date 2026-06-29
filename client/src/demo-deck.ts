import {
  createHandCard,
  generateCard,
  type HandCard,
  type Rarity,
  SeededRng,
} from "@magicalindustries/realm-clash-core";

const DEMO_NAMES: Record<Rarity, string[]> = {
  common: ["Impala", "Warthog", "Hyena", "Gazelle", "Vulture"],
  uncommon: ["Zebra", "Cheetah", "Baboon", "Jackal", "Ostrich"],
  rare: ["Leopard", "Buffalo", "Crocodile", "Kudu", "Hippo"],
  ultra: ["Giraffe", "Rhinoceros", "Eagle", "Wild Dog", "Secretary Bird"],
  secret: ["White Rhino", "Ancient Elephant", "King Cheetah", "Spirit Cat", "Ghost"],
  legendary: ["Savanna King", "Eternal Matriarch", "Apex Lion", "Storm Hippo", "Titan"],
};

function buildPlayerHand(seed: number, playerLabel: string): HandCard[] {
  const rng = new SeededRng(seed);
  const rarities: Rarity[] = ["common", "common", "uncommon", "rare", "ultra"];
  const hand: HandCard[] = [];

  for (let i = 0; i < 5; i += 1) {
    const rarity = rarities[i] ?? "common";
    const names = DEMO_NAMES[rarity];
    const name = names[rng.rollDie(names.length) - 1] ?? `Unit ${i + 1}`;
    const template = generateCard(
      {
        id: `${playerLabel}-${rarity}-${i}`,
        name,
        rarity,
        element: "savanna",
      },
      rng,
    );
    hand.push(createHandCard(template, `${playerLabel}-${i}`));
  }

  return hand;
}

export function createDemoHands(): { player0: HandCard[]; player1: HandCard[] } {
  return {
    player0: buildPlayerHand(0x0ace, "P0"),
    player1: buildPlayerHand(0xfeed, "P1"),
  };
}