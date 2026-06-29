import "../styles.css";
import { defaultFooter, mountShell } from "../ui/shell.js";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

mountShell(
  root,
  {
    activeRoute: "home",
    subtitle: "Tactical wildlife card battles",
    showBottomNav: true,
    marketingBackground: true,
  },
  `
    <div class="container">
      <section class="page-hero">
        <h2 class="heading-1">Place. Clash. Capture.</h2>
        <p class="body">
          Realm Clash is a two-player tactical card battle on a 4×4 grid. Roll dice, chain combos,
          and win by total health — not just card count. Built for the Wildlife Realms collection
          and your own custom decks.
        </p>
        <div class="cta-row">
          <a class="btn btn--primary" href="/play.html">Enter the Arena</a>
          <a class="btn btn--ghost" href="/rules.html">Read the Rules</a>
        </div>
      </section>

      <section class="page-section">
        <div class="section-header">
          <h3 class="heading-2">Explore the Realm</h3>
          <p class="body-sm">One consistent experience across battle, collection, and community.</p>
        </div>
        <div class="grid-features">
          <a class="surface-card surface-card--interactive" href="/play.html">
            <span class="badge badge--primary">Live prototype</span>
            <h4 class="heading-3" style="margin-top: var(--space-3)">Battle Arena</h4>
            <p class="body-sm">Local hot-seat matches wired to the authoritative Rules v2.0 engine.</p>
          </a>
          <a class="surface-card surface-card--interactive" href="/collection.html">
            <span class="badge badge--soon">Coming soon</span>
            <h4 class="heading-3" style="margin-top: var(--space-3)">Card Collection</h4>
            <p class="body-sm">Browse Wildlife Savanna sets and track cards you own across realms.</p>
          </a>
          <a class="surface-card surface-card--interactive" href="/create.html">
            <span class="badge badge--soon">Coming soon</span>
            <h4 class="heading-3" style="margin-top: var(--space-3)">Card Creator</h4>
            <p class="body-sm">Design custom cards outside the Wildlife universe with arrow layouts and stats.</p>
          </a>
          <a class="surface-card surface-card--interactive" href="/community.html">
            <span class="badge badge--soon">Coming soon</span>
            <h4 class="heading-3" style="margin-top: var(--space-3)">Community</h4>
            <p class="body-sm">Find matches, connect with players, and join ranked lobbies.</p>
          </a>
          <a class="surface-card surface-card--interactive" href="/rules.html">
            <h4 class="heading-3">Rules &amp; Guide</h4>
            <p class="body-sm">Placement modes, combat math, chain resolution, and victory scoring explained.</p>
          </a>
          <div class="surface-card">
            <span class="badge">PWA</span>
            <h4 class="heading-3" style="margin-top: var(--space-3)">Install Anywhere</h4>
            <p class="body-sm">Add to home screen on mobile or desktop for a standalone app experience.</p>
          </div>
        </div>
      </section>
    </div>
  `,
  defaultFooter(),
);