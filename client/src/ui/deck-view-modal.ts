import type { DeckCardEntry } from "../match/deck-tracker.js";
import { deckViewSectionsHtml } from "./card-detail-html.js";

export interface DeckViewOptions {
  title: string;
  subtitle: string;
  cards: DeckCardEntry[];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Show the player's live deck (opening hand + captures − losses). */
export function runDeckViewModal(options: DeckViewOptions): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    const bodyHtml =
      options.cards.length > 0
        ? `<div class="deck-view__sections">${deckViewSectionsHtml(options.cards)}</div>`
        : `<p class="deck-view__empty body-sm">No cards in your deck — every opening card was lost and none were captured.</p>`;

    overlay.innerHTML = `
      <div class="modal surface-card deck-view-modal">
        <header class="modal__header">
          <h2 class="heading-2">${escapeHtml(options.title)}</h2>
          <p class="body-sm">${escapeHtml(options.subtitle)}</p>
        </header>
        ${bodyHtml}
        <footer class="modal__footer">
          <button type="button" class="btn btn--primary" data-deck-view-close>Close</button>
        </footer>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");

    const close = (): void => {
      overlay.remove();
      if (!document.querySelector(".modal-overlay")) {
        document.body.classList.remove("modal-open");
      }
      resolve();
    };

    overlay.querySelector<HTMLButtonElement>("[data-deck-view-close]")?.focus();
    overlay.querySelector("[data-deck-view-close]")?.addEventListener("click", close, { once: true });
    overlay.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") close();
      },
      { once: true },
    );
  });
}