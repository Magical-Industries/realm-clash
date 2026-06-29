import "../styles.css";
import { defaultFooter, mountShell } from "../ui/shell.js";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

mountShell(
  root,
  {
    activeRoute: "rules",
    subtitle: "Rules v2.0 guide",
    showBottomNav: true,
    marketingBackground: true,
  },
  `
    <div class="container">
      <section class="page-hero">
        <h2 class="heading-1">How to Play</h2>
        <p class="body">
          Realm Clash is a two-player tactical card battle. Place animals on a 4×4 grid, fight with
          directional arrows, and reduce enemy health to capture. Win by highest total HP on the board.
        </p>
      </section>

      <section class="page-section">
        <div class="section-header">
          <h3 class="heading-2">Setup</h3>
        </div>
        <div class="grid-features">
          <div class="surface-card">
            <h4 class="heading-3">The Grid</h4>
            <p class="body-sm">4×4 board, 5 cards per player, no deck. Each player places one card per turn until all 10 are on the board.</p>
          </div>
          <div class="surface-card">
            <h4 class="heading-3">Card Back</h4>
            <p class="body-sm">HP at center (hex), up to 8 arrows with attack/defense digits. Rarer cards tend toward more arrows.</p>
          </div>
          <div class="surface-card">
            <h4 class="heading-3">Victory</h4>
            <p class="body-sm">Sum on-board HP when all cards are placed. Tiebreakers: card count, then rarity value.</p>
          </div>
        </div>
      </section>

      <section class="page-section">
        <div class="section-header">
          <h3 class="heading-2">Placement Modes</h3>
          <p class="body-sm">When both modes are available, choose one — not both on the same turn.</p>
        </div>
        <div class="grid-features">
          <div class="surface-card">
            <span class="badge badge--primary">Capture</span>
            <h4 class="heading-3" style="margin-top: var(--space-3)">Capture Mode</h4>
            <p class="body-sm">Take undefended adjacent enemy cards at their current HP. No dice, no chain.</p>
          </div>
          <div class="surface-card">
            <span class="badge" style="color: var(--secondary); border-color: color-mix(in srgb, var(--secondary) 35%, transparent)">Attack</span>
            <h4 class="heading-3" style="margin-top: var(--space-3)">Attack Mode</h4>
            <p class="body-sm">Mutual-arrow battles with dice damage. Reduce HP to 0 to capture at 1 HP and trigger chain attacks.</p>
          </div>
        </div>
      </section>

      <section class="page-section">
        <div class="section-header">
          <h3 class="heading-2">Combat Math</h3>
        </div>
        <div class="surface-card">
          <p class="body-sm"><strong style="color: var(--text-primary)">Damage:</strong> (attack + 1d6) × 2</p>
          <p class="body-sm" style="margin-top: var(--space-2)"><strong style="color: var(--text-primary)">Counter:</strong> (defense − attack) + 1d6</p>
          <p class="body-sm" style="margin-top: var(--space-2)"><strong style="color: var(--text-primary)">Chains:</strong> Depth-first — each combat capture resolves fully before returning up the chain.</p>
        </div>
        <div class="cta-row">
          <a class="btn btn--primary" href="/play.html?mode=cpu&realm=wildlife">Try it in the Arena</a>
        </div>
      </section>
    </div>
  `,
  defaultFooter(),
);