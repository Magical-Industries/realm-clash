import "../styles.css";
import { getRealm, DEFAULT_REALM_ID } from "../realms/index.js";
import { interactiveSurfaceCardHtml } from "../realms/render.js";
import { defaultFooter, mountShell } from "../ui/shell.js";

const params = new URLSearchParams(window.location.search);
const realmId = params.get("r") ?? DEFAULT_REALM_ID;
const realm = getRealm(realmId);

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

if (!realm) {
  mountShell(
    root,
    { activeRoute: "realms", subtitle: "Realm not found", showBottomNav: true, marketingBackground: true },
    `<div class="container"><section class="page-hero"><h2 class="heading-1">Realm not found</h2><p class="body">Unknown realm id: ${realmId}</p><a class="btn btn--primary" href="/realms.html">Browse realms</a></section></div>`,
    defaultFooter(),
  );
} else {
  const collectionHref = `/realm-collection.html?r=${encodeURIComponent(realm.id)}`;
  const createHref = `/realm-create.html?r=${encodeURIComponent(realm.id)}`;

  mountShell(
    root,
    {
      activeRoute: "realms",
      title: realm.name,
      subtitle: realm.tagline,
      showBottomNav: true,
      marketingBackground: true,
    },
    `
      <div class="container">
        <section class="page-hero">
          <h2 class="heading-1">${realm.name}</h2>
          <p class="body">${realm.description}</p>
        </section>
        <section class="page-section">
          <div class="grid-features">
            ${interactiveSurfaceCardHtml({
              href: collectionHref,
              ariaLabel: `Open ${realm.name} card collection`,
              innerHtml: `
                <h4 class="heading-3">Card Collection</h4>
                <p class="body-sm">Browse sets and cards unique to the ${realm.name} realm.</p>
              `,
            })}
            ${interactiveSurfaceCardHtml({
              href: createHref,
              ariaLabel: `Open ${realm.name} card creator`,
              innerHtml: `
                <h4 class="heading-3">Card Creator</h4>
                <p class="body-sm">Design custom cards that belong to ${realm.name} — stats, arrows, and rarity.</p>
              `,
            })}
            <div class="surface-card">
              <span class="badge badge--primary">Arena</span>
              <h4 class="heading-3" style="margin-top: var(--space-3)">Play vs Computer</h4>
              <p class="body-sm">Practice against a rules-based opponent. Stronger difficulties deal tougher cards to the CPU.</p>
              <div class="difficulty-row">
                <a class="btn btn--primary btn--sm" href="/play.html?mode=cpu&realm=${encodeURIComponent(realm.id)}&difficulty=easy">Easy</a>
                <a class="btn btn--secondary btn--sm" href="/play.html?mode=cpu&realm=${encodeURIComponent(realm.id)}&difficulty=medium">Medium</a>
                <a class="btn btn--secondary btn--sm" href="/play.html?mode=cpu&realm=${encodeURIComponent(realm.id)}&difficulty=hard">Hard</a>
                <a class="btn btn--danger btn--sm" href="/play.html?mode=cpu&realm=${encodeURIComponent(realm.id)}&difficulty=legend">Legend</a>
              </div>
            </div>
            ${interactiveSurfaceCardHtml({
              href: `/play.html?mode=pvp&realm=${encodeURIComponent(realm.id)}`,
              ariaLabel: `Play ${realm.name} vs friend`,
              innerHtml: `
                <h4 class="heading-3">Play vs Friend</h4>
                <p class="body-sm">Local hot-seat match with ${realm.name} cards.</p>
              `,
            })}
          </div>
        </section>
      </div>
    `,
    defaultFooter(),
  );
}