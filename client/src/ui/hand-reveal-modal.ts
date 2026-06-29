import type { HandCard } from "@magicalindustries/realm-clash-core";

const DIRECTION_LABELS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export interface HandRevealStep {
  title: string;
  subtitle: string;
  buttonLabel: string;
  cards: HandCard[];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatHp(hp: number): string {
  return `0x${hp.toString(16).toUpperCase().padStart(3, "0")}`;
}

function cardDetailHtml(card: HandCard): string {
  const arrows = card.template.arrows
    .map((arrow) => {
      const dir = DIRECTION_LABELS[arrow.direction] ?? `D${arrow.direction}`;
      const atk = arrow.attack.toString(16).toUpperCase();
      const def = arrow.defense.toString(16).toUpperCase();
      return `<li><span class="hand-reveal-card__arrow-dir">${dir}</span> ${atk}/${def}</li>`;
    })
    .join("");

  return `
    <article class="hand-reveal-card rarity-${card.template.rarity}">
      <header class="hand-reveal-card__header">
        <h4 class="hand-reveal-card__name">${escapeHtml(card.template.name)}</h4>
        <span class="badge">${escapeHtml(card.template.rarity)}</span>
      </header>
      <dl class="hand-reveal-card__stats">
        <div><dt>HP</dt><dd>${formatHp(card.template.maxHp)} (${card.template.maxHp})</dd></div>
        <div><dt>Arrows</dt><dd>${card.template.arrows.length}</dd></div>
        ${card.template.element ? `<div><dt>Element</dt><dd>${escapeHtml(card.template.element)}</dd></div>` : ""}
      </dl>
      <ul class="hand-reveal-card__arrows">${arrows}</ul>
    </article>
  `;
}

function renderOverlay(step: HandRevealStep): HTMLElement {
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
      <div class="hand-reveal-grid">
        ${step.cards.map((card) => cardDetailHtml(card)).join("")}
      </div>
      <footer class="modal__footer">
        <button type="button" class="btn btn--primary" data-hand-reveal-continue>
          ${escapeHtml(step.buttonLabel)}
        </button>
      </footer>
    </div>
  `;
  return overlay;
}

/** Show a sequence of hand-reveal modals; resolves when the player dismisses the last one. */
export function runHandRevealSequence(steps: HandRevealStep[]): Promise<void> {
  if (steps.length === 0) return Promise.resolve();

  return new Promise((resolve) => {
    let index = 0;

    const showStep = (): void => {
      const step = steps[index];
      if (!step) {
        resolve();
        return;
      }

      const overlay = renderOverlay(step);
      document.body.appendChild(overlay);
      document.body.classList.add("modal-open");

      const button = overlay.querySelector<HTMLButtonElement>("[data-hand-reveal-continue]");
      button?.focus();

      const dismiss = (): void => {
        overlay.remove();
        if (!document.querySelector(".modal-overlay")) {
          document.body.classList.remove("modal-open");
        }
        index += 1;
        showStep();
      };

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