import "../styles.css";
import { defaultFooter, mountShell } from "../ui/shell.js";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

mountShell(
  root,
  {
    activeRoute: "community",
    subtitle: "Players & matchmaking",
    showBottomNav: true,
    marketingBackground: true,
  },
  `
    <div class="container">
      <section class="page-hero">
        <h2 class="heading-1">Community Hub</h2>
        <p class="body">
          Find opponents, join ranked lobbies, and connect with other Realm Clash players.
          Online PvP requires the match backend — currently in planning.
        </p>
        <span class="badge badge--soon">Matchmaking coming with server launch</span>
      </section>

      <section class="page-section">
        <div class="grid-features">
          <div class="surface-card">
            <h4 class="heading-3">Quick Match</h4>
            <p class="body-sm">Queue for a casual game with similar skill. Requires account sign-in.</p>
            <button class="btn btn--primary" type="button" disabled style="margin-top: var(--space-4)">Find match</button>
          </div>
          <div class="surface-card">
            <h4 class="heading-3">Friends</h4>
            <p class="body-sm">Invite friends to private lobbies with custom rules and card pools.</p>
            <button class="btn btn--secondary" type="button" disabled style="margin-top: var(--space-4)">Connect</button>
          </div>
          <div class="surface-card">
            <h4 class="heading-3">Local Play</h4>
            <p class="body-sm">Pass-and-play on one device — available now in the Arena.</p>
            <a class="btn btn--ghost" href="/play.html" style="margin-top: var(--space-4)">Open Arena</a>
          </div>
        </div>
      </section>
    </div>
  `,
  defaultFooter(),
);