import type { HandCard } from "@magicalindustries/realm-clash-core";

import type { DeckCardEntry } from "../match/deck-tracker.js";

const DIRECTION_LABELS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function formatHpHex(hp: number): string {
  return `0x${hp.toString(16).toUpperCase().padStart(3, "0")}`;
}

function arrowListHtml(card: HandCard): string {
  return card.template.arrows
    .map((arrow) => {
      const dir = DIRECTION_LABELS[arrow.direction] ?? `D${arrow.direction}`;
      const atk = arrow.attack.toString(16).toUpperCase();
      const def = arrow.defense.toString(16).toUpperCase();
      return `<li><span class="hand-reveal-card__arrow-dir">${dir}</span> ${atk}/${def}</li>`;
    })
    .join("");
}

export function cardDetailHtml(card: HandCard): string {
  return `
    <article class="hand-reveal-card rarity-${card.template.rarity}">
      <header class="hand-reveal-card__header">
        <h4 class="hand-reveal-card__name">${escapeHtml(card.template.name)}</h4>
        <span class="badge">${escapeHtml(card.template.rarity)}</span>
      </header>
      <dl class="hand-reveal-card__stats">
        <div><dt>HP</dt><dd>${formatHpHex(card.template.maxHp)} (${card.template.maxHp})</dd></div>
        <div><dt>Arrows</dt><dd>${card.template.arrows.length}</dd></div>
        ${card.template.element ? `<div><dt>Element</dt><dd>${escapeHtml(card.template.element)}</dd></div>` : ""}
      </dl>
      <ul class="hand-reveal-card__arrows">${arrowListHtml(card)}</ul>
    </article>
  `;
}

function deckStatusBadge(entry: DeckCardEntry): string {
  switch (entry.status) {
    case "in_hand":
      return "Still in hand";
    case "on_board":
      return "On board";
    case "captured":
      return "Captured";
  }
}

function deckStatusDetail(entry: DeckCardEntry): string {
  switch (entry.status) {
    case "in_hand":
      return "Not placed yet — available to play";
    case "on_board":
      return `Cell (${entry.position!.row},${entry.position!.col}) · ${entry.currentHp} HP remaining`;
    case "captured":
      return `Cell (${entry.position!.row},${entry.position!.col}) · ${entry.currentHp} HP`;
  }
}

function deckHpHtml(entry: DeckCardEntry): string {
  const maxHp = entry.card.template.maxHp;
  if (entry.status === "in_hand") {
    return `${formatHpHex(maxHp)} (${maxHp})`;
  }
  return `${entry.currentHp} / ${maxHp} (${formatHpHex(entry.currentHp!)})`;
}

export function deckCardDetailHtml(entry: DeckCardEntry): string {
  return `
    <article class="hand-reveal-card deck-card deck-card--${entry.status} rarity-${entry.card.template.rarity}">
      <header class="hand-reveal-card__header">
        <h4 class="hand-reveal-card__name">${escapeHtml(entry.card.template.name)}</h4>
        <div class="deck-card__badges">
          <span class="deck-card__location deck-card__location--${entry.status}">${escapeHtml(deckStatusBadge(entry))}</span>
          <span class="badge">${escapeHtml(entry.card.template.rarity)}</span>
        </div>
      </header>
      <p class="deck-card__detail">${escapeHtml(deckStatusDetail(entry))}</p>
      <dl class="hand-reveal-card__stats">
        <div><dt>HP</dt><dd>${deckHpHtml(entry)}</dd></div>
        <div><dt>Arrows</dt><dd>${entry.card.template.arrows.length}</dd></div>
        ${entry.card.template.element ? `<div><dt>Element</dt><dd>${escapeHtml(entry.card.template.element)}</dd></div>` : ""}
      </dl>
      <ul class="hand-reveal-card__arrows">${arrowListHtml(entry.card)}</ul>
    </article>
  `;
}

export function deckViewSectionsHtml(cards: DeckCardEntry[]): string {
  const sections: { id: DeckCardEntry["status"]; title: string; hint: string }[] = [
    {
      id: "in_hand",
      title: "Still in hand",
      hint: "Cards you haven't placed yet",
    },
    {
      id: "on_board",
      title: "Placed on board",
      hint: "Your opening cards currently in play",
    },
    {
      id: "captured",
      title: "Captured",
      hint: "Enemy cards now under your control",
    },
  ];

  return sections
    .map((section) => {
      const entries = cards.filter((entry) => entry.status === section.id);
      if (entries.length === 0) return "";

      return `
        <section class="deck-view__section" data-deck-section="${section.id}">
          <header class="deck-view__section-header">
            <h3 class="deck-view__section-title">${escapeHtml(section.title)}</h3>
            <p class="deck-view__section-hint body-sm">${escapeHtml(section.hint)}</p>
            <span class="deck-view__section-count">${entries.length}</span>
          </header>
          <div class="hand-reveal-grid deck-view__section-grid">
            ${entries.map((entry) => deckCardDetailHtml(entry)).join("")}
          </div>
        </section>
      `;
    })
    .join("");
}