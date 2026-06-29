import "../styles.css";
import { listRealms } from "../realms/index.js";
import { interactiveSurfaceCardHtml, realmTileHtml } from "../realms/render.js";
import { defaultFooter, mountShell } from "../ui/shell.js";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

const realmTiles = listRealms().map((realm) => realmTileHtml(realm)).join("");

mountShell(
  root,
  {
    activeRoute: "home",
    subtitle: "Tactical card battles across realms",
    showBottomNav: true,
    marketingBackground: true,
  },
  `
    <div class="container">
      <section class="page-hero">
        <h2 class="heading-1">Place. Clash. Capture.</h2>
        <p class="body">
          Realm Clash is a tactical card battle on a 4×4 grid. Choose a realm, build your
          collection, and win by total health — not just card count.
        </p>
      </section>

      <section class="page-section" id="realms">
        <div class="section-header section-header--center">
          <h3 class="heading-2">Choose Your Realm</h3>
          <p class="body-sm">Each realm has its own cards, collection, and card creator.</p>
        </div>
        <div class="grid-features grid-features--single">
          ${realmTiles}
        </div>
      </section>

      <section class="page-section">
        <div class="section-header section-header--center">
          <h3 class="heading-2">Battle Arena</h3>
          <p class="body-sm">Try the Rules v2.0 engine — play with a friend or against the computer.</p>
        </div>
        <div class="grid-features grid-features--single">
          <div class="surface-card surface-card--arena">
            <span class="badge badge--primary">Live prototype</span>
            <h4 class="heading-3" style="margin-top: var(--space-3)">Test the Game</h4>
            <p class="body-sm">Uses demo decks from the Wildlife realm. No account required.</p>
            <div class="cta-row" style="margin-top: var(--space-4)">
              <a class="btn btn--secondary" href="/play.html?mode=pvp&realm=wildlife">Play vs Friend</a>
              <a class="btn btn--ghost" href="/rules.html">Rules</a>
            </div>
            <p class="body-sm" style="margin-top: var(--space-4)">Vs Computer — pick a difficulty:</p>
            <div class="difficulty-row">
              <a class="btn btn--primary btn--sm" href="/play.html?mode=cpu&realm=wildlife&difficulty=easy">Easy</a>
              <a class="btn btn--secondary btn--sm" href="/play.html?mode=cpu&realm=wildlife&difficulty=medium">Medium</a>
              <a class="btn btn--secondary btn--sm" href="/play.html?mode=cpu&realm=wildlife&difficulty=hard">Hard</a>
              <a class="btn btn--danger btn--sm" href="/play.html?mode=cpu&realm=wildlife&difficulty=legend">Legend</a>
            </div>
          </div>
        </div>
      </section>

      <section class="page-section">
        <div class="section-header section-header--center">
          <h3 class="heading-2">Community</h3>
          <p class="body-sm">Online matchmaking arrives with the server backend.</p>
        </div>
        <div class="grid-features grid-features--single">
          ${interactiveSurfaceCardHtml({
            href: "/community.html",
            ariaLabel: "Open Community hub",
            innerHtml: `
              <span class="badge badge--soon">Coming soon</span>
              <h4 class="heading-3" style="margin-top: var(--space-3)">Find Matches</h4>
              <p class="body-sm">Connect with players, join ranked lobbies, and trade cards.</p>
            `,
          })}
        </div>
      </section>
    </div>
  `,
  defaultFooter(),
);