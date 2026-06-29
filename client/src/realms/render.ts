import type { CollectionCardPreview, RealmDefinition } from "./types.js";

export function realmTileHtml(realm: RealmDefinition): string {
  const badge =
    realm.status === "live"
      ? `<span class="badge badge--primary">Playable</span>`
      : `<span class="badge badge--soon">Coming soon</span>`;

  const inner = `
    ${badge}
    <h4 class="heading-3" style="margin-top: var(--space-3)">${escapeHtml(realm.name)}</h4>
    <p class="body-sm">${escapeHtml(realm.tagline)}</p>
    <p class="body-sm text-muted" style="margin-top: var(--space-2)">${escapeHtml(realm.description)}</p>
  `;

  if (realm.status !== "live") {
    return `<article class="surface-card">${inner}</article>`;
  }

  const href = `/realm.html?r=${encodeURIComponent(realm.id)}`;
  return interactiveSurfaceCardHtml({
    href,
    ariaLabel: `Open ${realm.name} realm`,
    innerHtml: inner,
  });
}

export function interactiveSurfaceCardHtml(options: {
  href: string;
  ariaLabel: string;
  innerHtml: string;
}): string {
  return `
    <article class="surface-card surface-card--interactive">
      ${options.innerHtml}
      <a class="surface-card__stretched-link" href="${escapeHtml(options.href)}" aria-label="${escapeHtml(options.ariaLabel)}"></a>
    </article>
  `;
}

export function collectionCardsHtml(cards: CollectionCardPreview[]): string {
  return cards
    .map(
      (card) => `
    <article class="tcg-card rarity-${card.rarity}">
      <span class="tcg-card__rarity" title="${escapeHtml(card.rarity)}"></span>
      <div class="tcg-card__body">
        <div class="tcg-card__name">${escapeHtml(card.name)}</div>
        <div class="tcg-card__meta">${escapeHtml(card.meta)}</div>
      </div>
    </article>
  `,
    )
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}