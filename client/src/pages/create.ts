import "../styles.css";
import { defaultFooter, mountShell } from "../ui/shell.js";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

mountShell(
  root,
  {
    activeRoute: "create",
    subtitle: "Custom card workshop",
    showBottomNav: true,
    marketingBackground: true,
  },
  `
    <div class="container">
      <section class="page-hero">
        <h2 class="heading-1">Create Your Own Cards</h2>
        <p class="body">
          Design cards outside the Wildlife universe — name, HP, arrow layout, attack/defense
          values, and rarity. Export for print or add to custom lobbies.
        </p>
        <span class="badge badge--soon">Workshop UI in development</span>
      </section>

      <section class="page-section">
        <div class="coming-soon">
          <h3 class="heading-3">Card Creator</h3>
          <p class="body-sm">The form below previews shared input styles. Full editor ships in a future update.</p>
        </div>
        <form class="grid-features" style="margin-top: var(--space-6)" onsubmit="return false">
          <label class="field">
            <span class="label">Card name</span>
            <input class="input" type="text" placeholder="e.g. Storm Drake" disabled />
          </label>
          <label class="field">
            <span class="label">Max HP (hex)</span>
            <input class="input" type="text" placeholder="0x080" disabled />
          </label>
          <label class="field">
            <span class="label">Rarity</span>
            <select class="select" disabled>
              <option>Common</option>
              <option>Rare</option>
              <option>Legendary</option>
            </select>
          </label>
          <label class="field" style="grid-column: 1 / -1">
            <span class="label">Notes</span>
            <textarea class="textarea" placeholder="Arrow layout, element, special ability…" disabled></textarea>
          </label>
        </form>
      </section>
    </div>
  `,
  defaultFooter(),
);