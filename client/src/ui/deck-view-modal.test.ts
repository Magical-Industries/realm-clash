import { describe, expect, it, afterEach } from "vitest";

import { handCards, cardTemplate } from "../test-fixtures.js";
import { deckViewSectionsHtml } from "./card-detail-html.js";
import { runDeckViewModal } from "./deck-view-modal.js";

describe("deckViewSectionsHtml", () => {
  it("groups cards into hand and board sections", () => {
    const lion = cardTemplate("lion", 32, [{ direction: 0, attack: 5, defense: 3 }]);
    const zebra = cardTemplate("zebra", 28, [{ direction: 2, attack: 4, defense: 4 }]);
    const html = deckViewSectionsHtml([
      { card: handCards("p1", [lion])[0]!, status: "in_hand" },
      {
        card: handCards("p1", [zebra])[0]!,
        status: "on_board",
        currentHp: 20,
        position: { row: 1, col: 2 },
      },
    ]);

    expect(html).toContain('data-deck-section="in_hand"');
    expect(html).toContain('data-deck-section="on_board"');
    expect(html).toContain("Still in hand");
    expect(html).toContain("Placed on board");
    expect(html).toContain("deck-card--in_hand");
    expect(html).toContain("deck-card--on_board");
  });
});

describe("runDeckViewModal", () => {
  afterEach(() => {
    document.body.classList.remove("modal-open");
    document.body.innerHTML = "";
  });

  it("renders grouped deck sections with location badges", async () => {
    const cards = handCards("p1", [cardTemplate("lion", 32, [{ direction: 0, attack: 5, defense: 3 }])]);
    const done = runDeckViewModal({
      title: "Your deck",
      subtitle: "Live roster",
      cards: cards.map((card) => ({ card, status: "in_hand" as const })),
    });

    expect(document.querySelector(".deck-view__section[data-deck-section='in_hand']")).not.toBeNull();
    expect(document.querySelector(".deck-card__location--in_hand")?.textContent).toBe("Still in hand");

    document.querySelector<HTMLButtonElement>("[data-deck-view-close]")?.click();
    await done;
  });

  it("shows an empty-state message when the deck has no cards", async () => {
    const done = runDeckViewModal({
      title: "Your deck",
      subtitle: "Live roster",
      cards: [],
    });

    expect(document.querySelector(".deck-view__empty")).not.toBeNull();

    document.querySelector<HTMLButtonElement>("[data-deck-view-close]")?.click();
    await done;
  });
});