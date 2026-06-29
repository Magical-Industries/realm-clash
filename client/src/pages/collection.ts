import "../styles.css";
import { defaultFooter, mountShell } from "../ui/shell.js";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

const demoCards = [
  { name: "African Elephant", rarity: "legendary", meta: "HP 0x120 · 6 arrows" },
  { name: "Cheetah", rarity: "rare", meta: "HP 0x0A0 · 4 arrows" },
  { name: "Warthog", rarity: "uncommon", meta: "HP 0x080 · 3 arrows" },
  { name: "Meerkat", rarity: "common", meta: "HP 0x050 · 2 arrows" },
  { name: "Lion", rarity: "ultra", meta: "HP 0x100 · 5 arrows" },
  { name: "Giraffe", rarity: "rare", meta: "HP 0x0B0 · 4 arrows" },
];

mountShell(
  root,
  {
    activeRoute: "collection",
    subtitle: "Wildlife Realms · African Savanna",
    showBottomNav: true,
    marketingBackground: true,
  },
  `
    <div class="container">
      <section class="page-hero">
        <h2 class="heading-1">Your Collection</h2>
        <p class="body">
          Browse and organize cards from Wildlife Realms sets. Full inventory sync and trade
          tracking are on the roadmap.
        </p>
        <span class="badge badge--soon">Gallery preview — full collection coming soon</span>
      </section>

      <section class="page-section">
        <div class="section-header">
          <h3 class="heading-2">African Savanna Set</h3>
          <p class="body-sm">162-card checklist · sample tiles below use the shared card component styles.</p>
        </div>
        <div class="grid-cards">
          ${demoCards
            .map(
              (card) => `
            <article class="tcg-card rarity-${card.rarity}">
              <span class="tcg-card__rarity" title="${card.rarity}"></span>
              <div class="tcg-card__body">
                <div class="tcg-card__name">${card.name}</div>
                <div class="tcg-card__meta">${card.meta}</div>
              </div>
            </article>
          `,
            )
            .join("")}
        </div>
      </section>
    </div>
  `,
  defaultFooter(),
);