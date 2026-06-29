export type AppRoute =
  | "home"
  | "realms"
  | "play"
  | "rules"
  | "community";

export interface NavItem {
  route: AppRoute;
  href: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { route: "home", href: "/", label: "Home", icon: "⌂" },
  { route: "realms", href: "/realms.html", label: "Realms", icon: "◈" },
  { route: "play", href: "/play.html?mode=cpu&realm=wildlife", label: "Arena", icon: "⚔" },
  { route: "community", href: "/community.html", label: "Community", icon: "◎" },
  { route: "rules", href: "/rules.html", label: "Rules", icon: "?" },
];

export interface ShellOptions {
  activeRoute: AppRoute;
  title?: string;
  subtitle?: string;
  status?: string;
  headerActions?: string;
  showBottomNav?: boolean;
  marketingBackground?: boolean;
}

function navLinkClass(route: AppRoute, active: AppRoute): string {
  return route === active ? "app-nav__link app-nav__link--active" : "app-nav__link";
}

function bottomLinkClass(route: AppRoute, active: AppRoute): string {
  return route === active ? "bottom-nav__link bottom-nav__link--active" : "bottom-nav__link";
}

const BOTTOM_NAV_ROUTES: AppRoute[] = ["home", "realms", "play", "community", "rules"];

export function renderShell(options: ShellOptions): string {
  const {
    activeRoute,
    title = "Realm Clash",
    subtitle,
    status,
    headerActions = "",
    showBottomNav = true,
    marketingBackground = activeRoute !== "play",
  } = options;

  const pageClass = [
    marketingBackground ? "page--marketing" : "",
    showBottomNav ? "page--with-bottom-nav" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const desktopNav = NAV_ITEMS.map(
    (item) =>
      `<a class="${navLinkClass(item.route, activeRoute)}" href="${item.href}">${item.label}</a>`,
  ).join("");

  const bottomNav = showBottomNav
    ? `<nav class="bottom-nav" aria-label="Mobile navigation">
        ${NAV_ITEMS.filter((item) => BOTTOM_NAV_ROUTES.includes(item.route))
          .map(
            (item) =>
              `<a class="${bottomLinkClass(item.route, activeRoute)}" href="${item.href}">
                <span class="bottom-nav__icon" aria-hidden="true">${item.icon}</span>
                <span>${item.label}</span>
              </a>`,
          )
          .join("")}
      </nav>`
    : "";

  const statusSlot = status
    ? `<div class="app-header__status" id="status">${escapeHtml(status)}</div>`
    : `<div class="app-header__status"></div>`;

  const subtitleHtml = subtitle
    ? `<p class="brand__subtitle">${escapeHtml(subtitle)}</p>`
    : "";

  return `
    <div id="app" class="${pageClass}">
      <header class="app-header">
        <a class="brand" href="/">
          <h1 class="brand__title">${escapeHtml(title)}</h1>
          ${subtitleHtml}
        </a>
        <nav class="app-nav" aria-label="Main navigation">${desktopNav}</nav>
        ${statusSlot}
        <div class="app-header__actions">${headerActions}</div>
      </header>
      <main class="app-main" id="main-content"></main>
      ${bottomNav}
    </div>
  `;
}

export function mountShell(
  root: HTMLElement,
  options: ShellOptions,
  mainHtml: string,
  footerHtml = "",
): void {
  root.innerHTML = renderShell(options);
  const main = root.querySelector("#main-content");
  if (main) {
    main.innerHTML = mainHtml;
  }
  if (footerHtml) {
    const footer = document.createElement("footer");
    footer.className = "app-footer";
    footer.innerHTML = footerHtml;
    const app = root.querySelector("#app");
    const bottomNav = root.querySelector(".bottom-nav");
    if (app) {
      if (bottomNav) {
        app.insertBefore(footer, bottomNav);
      } else {
        app.appendChild(footer);
      }
    }
  }
}

export function defaultFooter(): string {
  return `<p class="body-sm">Realm Clash · Rules v2.0 · Multi-realm PWA</p>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}