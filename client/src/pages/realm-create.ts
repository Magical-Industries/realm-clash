import "../styles.css";
import { getRealm, DEFAULT_REALM_ID } from "../realms/index.js";
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
  const defaults = realm.getCreatorDefaults();
  const elementOptions = defaults.elements
    .map((el) => `<option>${el.label}</option>`)
    .join("");
  const rarityOptions = defaults.rarityOptions
    .map((r) => `<option>${r.label}</option>`)
    .join("");

  mountShell(
    root,
    {
      activeRoute: "realms",
      title: realm.name,
      subtitle: "Card Creator",
      showBottomNav: true,
      marketingBackground: true,
    },
    `
      <div class="container">
        <section class="page-hero">
          <h2 class="heading-1">Create a ${realm.name} Card</h2>
          <p class="body">
            Cards you create here belong to the <strong>${realm.name}</strong> realm — elements,
            naming, and defaults are tuned for this universe.
          </p>
          <span class="badge badge--soon">Workshop UI in development</span>
        </section>
        <section class="page-section">
          <form class="grid-features" onsubmit="return false">
            <label class="field">
              <span class="label">Card name</span>
              <input class="input" type="text" placeholder="${defaults.placeholderName}" disabled />
            </label>
            <label class="field">
              <span class="label">Max HP (hex)</span>
              <input class="input" type="text" placeholder="${defaults.placeholderHp}" disabled />
            </label>
            <label class="field">
              <span class="label">Element</span>
              <select class="select" disabled>${elementOptions}</select>
            </label>
            <label class="field">
              <span class="label">Rarity</span>
              <select class="select" disabled>${rarityOptions}</select>
            </label>
            <label class="field" style="grid-column: 1 / -1">
              <span class="label">Notes</span>
              <textarea class="textarea" placeholder="${defaults.notesPlaceholder}" disabled></textarea>
            </label>
          </form>
          <div class="cta-row" style="margin-top: var(--space-6)">
            <a class="btn btn--ghost" href="/realm.html?r=${encodeURIComponent(realm.id)}">Back to ${realm.name}</a>
          </div>
        </section>
      </div>
    `,
    defaultFooter(),
  );
}