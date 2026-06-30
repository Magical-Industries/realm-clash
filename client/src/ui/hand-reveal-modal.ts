import type { HandCard } from "@magicalindustries/realm-clash-core";

import { cardDetailHtml } from "./card-detail-html.js";

export interface HandRevealStep {
  title: string;
  subtitle: string;
  buttonLabel: string;
  cards: HandCard[];
}

export interface HandRevealOptions {
  /** Redeal hands and return fresh cards for the current step. */
  onShuffle?: (stepIndex: number) => HandCard[] | null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderOverlay(step: HandRevealStep, showShuffle: boolean): HTMLElement {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.innerHTML = `
    <div class="modal surface-card">
      <header class="modal__header">
        <h2 class="heading-2">${escapeHtml(step.title)}</h2>
        <p class="body-sm">${escapeHtml(step.subtitle)}</p>
      </header>
      <div class="hand-reveal-grid" data-hand-reveal-grid>
        ${step.cards.map((card) => cardDetailHtml(card)).join("")}
      </div>
      <footer class="modal__footer hand-reveal__footer">
        ${
          showShuffle
            ? `<button type="button" class="btn btn--ghost" data-hand-reveal-shuffle>Shuffle deck</button>`
            : ""
        }
        <button type="button" class="btn btn--primary" data-hand-reveal-continue>
          ${escapeHtml(step.buttonLabel)}
        </button>
      </footer>
    </div>
  `;
  return overlay;
}

/** Show a sequence of hand-reveal modals; resolves when the player dismisses the last one. */
export function runHandRevealSequence(
  steps: HandRevealStep[],
  options: HandRevealOptions = {},
): Promise<void> {
  if (steps.length === 0) return Promise.resolve();

  return new Promise((resolve) => {
    let index = 0;

    const showStep = (): void => {
      const step = steps[index];
      if (!step) {
        resolve();
        return;
      }

      const overlay = renderOverlay(step, Boolean(options.onShuffle));
      document.body.appendChild(overlay);
      document.body.classList.add("modal-open");

      const grid = overlay.querySelector<HTMLElement>("[data-hand-reveal-grid]");
      const button = overlay.querySelector<HTMLButtonElement>("[data-hand-reveal-continue]");
      const shuffleButton = overlay.querySelector<HTMLButtonElement>("[data-hand-reveal-shuffle]");
      button?.focus();

      const dismiss = (): void => {
        overlay.remove();
        if (!document.querySelector(".modal-overlay")) {
          document.body.classList.remove("modal-open");
        }
        index += 1;
        showStep();
      };

      shuffleButton?.addEventListener("click", () => {
        const fresh = options.onShuffle?.(index);
        if (!fresh || !grid) return;
        step.cards = fresh;
        grid.innerHTML = fresh.map((card) => cardDetailHtml(card)).join("");
      });

      button?.addEventListener("click", dismiss, { once: true });
      overlay.addEventListener(
        "keydown",
        (event) => {
          if (event.key === "Escape") dismiss();
        },
        { once: true },
      );
    };

    showStep();
  });
}