import "../styles.css";
import { listRealms } from "../realms/index.js";
import { realmTileHtml } from "../realms/render.js";
import { defaultFooter, mountShell } from "../ui/shell.js";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

mountShell(
  root,
  {
    activeRoute: "realms",
    subtitle: "Collections, creators, and lore",
    showBottomNav: true,
    marketingBackground: true,
  },
  `
    <div class="container">
      <section class="page-hero">
        <h2 class="heading-1">Realms</h2>
        <p class="body">
          Every realm is a self-contained universe with its own cards, collection, and creator tools.
        </p>
      </section>
      <section class="page-section">
        <div class="grid-features">
          ${listRealms().map((realm) => realmTileHtml(realm)).join("")}
        </div>
      </section>
    </div>
  `,
  defaultFooter(),
);