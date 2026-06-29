# Changelog

Site release history (`major.minor.build`). Newest first.

## 1.1.5

- Landing page: realm, Battle Arena, and community tiles share centered `grid-features--single` width (24rem); section headers centered

## 1.1.4

- **GitHub Pages fix** — Pages was on legacy branch deploy (Jekyll rendered `README.md` instead of the Vite client). Switched source to GitHub Actions workflow; removed repo-root `CNAME` that triggered branch-based custom-domain mapping
- Deploy workflow now verifies `client/dist/index.html`, `CNAME`, and `.nojekyll` before upload
- Site version footer (`version.json` → `client/src/version.ts`)

## 1.1.3

- Moved full release history from README to this file; README shows only the latest change

## 1.1.2

- Added dedicated changelog section to README (updated on every release)

## 1.1.1

- Site version displayed in the footer on all marketing pages
- Centralized version in [`version.json`](version.json) with bump policy in README
- Fixed interactive card rendering (stretch-link pattern — no more default blue underlined link text inside cards)

## 1.1.0

- **Multi-realm architecture** — `client/src/realms/` registry; realm-scoped decks, collections, and creators
- **Wildlife realm** — demo deck, collection preview, card creator tooling
- **New pages** — `/realms.html`, `/realm.html`, `/realm-collection.html`, `/realm-create.html`
- **CPU opponent** — rules-based AI with `easy` / `medium` / `hard` / `legend` difficulty (weighted card dealing)
- **Pre-game hand reveal** — modal flow for PvP pass-and-reveal and CPU single-hand preview
- **Landing redesign** — realm tiles, Battle Arena difficulty row, Realms-first navigation
- **Arena UX** — Player 1 hand bottom, Player 2 top; responsive card sizing; Safari hand overlap fix
- **Global nav** — Home, Realms, Arena, Community, Rules

## 1.0.0

- **Playable prototype** — PixiJS arena wired to `@magicalindustries/realm-clash-core` (Rules v2.0)
- **Design system** — teal/magenta dark theme, shared layout and components
- **Marketing site** — home, play, rules, community, collection, and create pages (Vite MPA)
- **GitHub Pages** — deploy workflow, `CNAME` for `realmclash.magical.enterprises`, PWA manifest and icons
- **Core rules engine** — placement modes, combat, chains, scoring, and card generation tests