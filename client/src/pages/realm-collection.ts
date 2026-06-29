import "../styles.css";
import { getRealm, DEFAULT_REALM_ID } from "../realms/index.js";
import { collectionCardsHtml } from "../realms/render.js";
import { defaultFooter, mountShell } from "../ui/shell.js";

const params = new URLSearchParams(window.location.search);
const realmId = params.get("r") ?? DEFAULT_REALM_ID;
const realm = getRealm(realmId);

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

if (!realm) {
  mountShell(
    root,
    { activeRoute: "realms", subtitle: "Not found", showBottomNav: true, marketingBackground: true },
    `<div class="container"><p class="body">Unknown realm.</p></div>`,
    defaultFooter(),
  );
} else {
  const cards = realm.getCollectionPreview();
  const setName = cards[0]?.set ?? `${realm.name} Set`;

  mountShell(
    root,
    {
      activeRoute: "realms",
      title: realm.name,
      subtitle: `Collection · ${setName}`,
      showBottomNav: true,
      marketingBackground: true,
    },
    `
      <div class="container">
        <section class="page-hero">
          <h2 class="heading-1">${realm.name} Collection</h2>
          <p class="body">Cards and sets belonging to the ${realm.name} realm.</p>
          <span class="badge badge--soon">Gallery preview — full inventory coming soon</span>
        </section>
        <section class="page-section">
          <div class="section-header">
            <h3 class="heading-2">${setName}</h3>
            <p class="body-sm">Sample cards using shared collection tile styles.</p>
          </div>
          <div class="grid-cards">${collectionCardsHtml(cards)}</div>
          <div class="cta-row" style="margin-top: var(--space-6)">
            <a class="btn btn--ghost" href="/realm.html?r=${encodeURIComponent(realm.id)}">Back to ${realm.name}</a>
            <a class="btn btn--primary" href="/realm-create.html?r=${encodeURIComponent(realm.id)}">Create a card</a>
          </div>
        </section>
      </div>
    `,
    defaultFooter(),
  );
}