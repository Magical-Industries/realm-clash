# Realm Clash

**Rules version:** 2.0

A tactical two-player card battle game for collectible wildlife trading cards. Players place animals on a **4×4 grid**, fight with **directional arrows**, roll dice for damage, and reduce enemy **health** to zero to capture. Chain combos can snowball across the board. The player with the **highest total health** on the board at the end wins.

Realm Clash is inspired by the spirit of *Tetra Master* (directional arrows, grid placement, chain combos) but uses its own combat system — **attack/defense arrows**, **health pools**, **dice damage**, and **capture-vs-attack mode choice** — so it stands on its own as an original game.

Designed to pair with the **Wildlife Realms** collectible card line (3D-printed HueForge cards), though any compatible card set with arrow layouts can be used.

**Live site:** [realmclash.magical.enterprises](https://realmclash.magical.enterprises) (GitHub Pages)

**Site version:** `1.1.13` (`major.minor.build` — also shown in the site footer)

**Latest change:** Live deck groups in-hand vs on-board cards with distinct styling.

### Versioning

Canonical source: [`version.json`](version.json). On every change: bump the version there, update **Site version** and **Latest change** above, and prepend the full entry to [`CHANGELOG.md`](CHANGELOG.md).

| Part | Bump when |
|------|-----------|
| **build** | Every iteration / any change shipped |
| **minor** | New features — extra pages, large refactors |
| **major** | Major redesign — backend launch, new realm, platform shifts |

### Testing

Run the full suite from the repo root:

```bash
npm test
```

| Package | What to test | Command |
|---------|----------------|---------|
| **core** | Rules engine — placement, combat, chains, scoring | `cd core && npm test` |
| **client** | Controller, CPU AI, panels, modals, shell, layout CSS contracts | `cd client && npm test` |

**Policy:** every new feature ships with tests — core logic in `core/src/**/*.test.ts`, client behavior/UI in `client/src/**/*.test.ts`. CI runs both suites before deploy.

---

## Platform

Realm Clash is a **web-first Progressive Web App (PWA)** — one client for desktop and mobile browsers, with no native App Store or Play Store builds planned.

| Layer | Choice | Role |
|-------|--------|------|
| **Game client** | PixiJS + TypeScript | Board, cards, arrows, animations, VFX |
| **Site shell** | Static site (same repo) | Rules, lore, account entry, install prompt |
| **Game backend** | Dynamic API (later) | Matchmaking, authoritative rules, PvP sync |
| **Distribution** | PWA | Add-to-home-screen, offline shell, unified deploy |

### Why PixiJS + TypeScript

- **2D-first** — Grid tactics and card combat map naturally to Pixi; no 3D engine overhead.
- **Lean vs Flutter Web** — Smaller initial load than CanvasKit-based stacks; important on mobile browsers and cellular connections.
- **WebGL effects** — Shaders and filters support rarity shimmer, clash flashes, and chain-attack trails.
- **PWA-friendly** — Service worker caches the client; gameplay traffic stays small (turn-based intents, not heavy asset streaming).
- **Backend synergy** — TypeScript on client and API keeps types and protocols aligned.
- **Canvas rendering** — Card art is drawn to canvas, not exposed as trivial DOM images (raising the bar on casual scraping, not a security vault).

### Planned client architecture

```
realm-clash/
├── client/         # PWA site + PixiJS arena (deployed to GitHub Pages)
├── core/           # TypeScript rules engine (v2.0) — shared with server
└── server/         # Authoritative match backend (future)
```

The **`core/`** package (`@magicalindustries/realm-clash-core`) enforces Realm Clash v2.0 rules: placement modes, combat, chains, scoring, and card generation.

The **`client/`** package is a minimal PixiJS hot-seat prototype wired to the core engine. Run it with:

```bash
cd client && npm install && npm run dev
```

Then open the local Vite URL (default `http://localhost:5173`).

### Deploy to GitHub Pages

Pushes to `main` build `client/dist` and deploy via GitHub Actions (`.github/workflows/deploy-pages.yml`).

**One-time GitHub setup:**

1. Repo **Settings → Pages → Build and deployment → Source:** **GitHub Actions** (not “Deploy from branch”). If the site shows rendered `README.md`, the source is still on branch deploy — switch it to GitHub Actions and re-run the deploy workflow.
2. After the first successful deploy, set **Custom domain** to `realmclash.magical.enterprises`
3. Keep the custom-domain `CNAME` only in `client/public/CNAME` (copied into `client/dist` on build). **Do not** add a `CNAME` at the repo root — that enables Jekyll branch deploy and overrides the built client.

**DNS (at your domain host):**

| Type  | Name        | Value                         |
|-------|-------------|-------------------------------|
| CNAME | realmclash  | `magical-industries.github.io` |

Wait for DNS + HTTPS (GitHub enables TLS automatically once the CNAME verifies).

**Local production build:**

```bash
npm run build
# output in client/dist/
```

---

## What Makes Realm Clash Distinctive

- **Directional attack and defense** — Each arrow carries its own **attack** and **defense** values. A card can be fierce to the north and vulnerable to the south.
- **Health and damage** — Cards are not captured in a single clash. They must be worn down and finished at **0 HP** (except undefended instant captures).
- **Dice tension** — Damage uses **1d6** so skill and luck blend; good positioning still dominates over time.
- **Capture vs attack choice** — On placement, choose **Capture mode** (free undefended takes) or **Attack mode** (mutual-arrow battles). You cannot do both on the same turn when both are available.
- **Depth-first chain combos** — Capturing via combat lets the new card attack immediately, resolving fully before returning up the chain.
- **Health race victory** — Win by **total remaining HP** on the board, not just card count. Preserving a wounded legendary can still win the match.
- **Collection economy** — Captured cards change owners per lobby rules, encouraging trades and rematches.

---

## Card Components

Each playable card uses the **back** for game information:

| Component | Description |
|-----------|-------------|
| **Health (HP)** | 3-digit hex value at card center (display range `0x010`–`0x180`). Current HP tracked during play. |
| **Arrows** | 1–8 directions (N, NE, E, SE, S, SW, W, NW). Rarer cards tend toward more arrows. |
| **Attack** | First hex digit (`0`–`F`) on each arrow. Offensive power in that direction. |
| **Defense** | Second hex digit (`0`–`F`) on each arrow. Resistance from that direction. |
| **Element** | Optional biome tag (Savanna, Jungle, Ocean, Mountain, etc.). Lobby toggle. |
| **Special Ability** | Optional one-time effect on higher-rarity cards. |

**Arrow stat format:** `A/9` → Attack 10, Defense 9 in that direction.

**Generation note:** HP, attack, and defense are rolled per card within rarity-weighted ranges (see [Numeric Tuning](#numeric-tuning-v20)). Commons skew low; legendaries skew high. No card should be strong in every direction.

---

## Setup

1. Each player selects **5 cards** (no deck — each card is placed at most once).
2. Use a **4×4 grid** (16 cells).
3. Choose **ownership mode** for the session (see [Card Ownership](#card-ownership)).
4. Optionally enable **element bonus** in the lobby.
5. Determine first player (coin flip, etc.).
6. Players alternate placing **one card per turn** on an empty cell.

---

## Turn Structure

1. **Place** one card from your hand on an empty grid cell.
2. **Declare mode** for that placement:
   - **Capture mode** — if any arrow points at an adjacent enemy card **without** a defending arrow pointing back.
   - **Attack mode** — if any arrow points at an adjacent enemy card **with** a mutual defending arrow.
   - If **both** are possible, the placing player **must choose one mode**. If only one is possible, that mode is forced.
3. **Resolve** all effects for that mode (see [Battle Rules](#battle-rules)).
4. **End turn** — pass to opponent.

Arrows pointing at **empty cells do nothing**.

---

## Battle Rules

### Capture mode

For each arrow on the placed card that points at an adjacent enemy card **without** a defending arrow pointing back:

- That enemy card is **instantly captured** (no damage roll, no HP check).
- Captured card transfers to the placing player at **current HP**.
- Each capture triggers a **chain combo** (see [Chain Combos](#chain-combos)).

**Capture mode does not resolve mutual-arrow battles.**

### Attack mode

For **every** mutual-arrow adjacency on the placed card:

- The placing player **must** resolve all such attacks.
- The player chooses the **order** in which mutual arrows fire.
- Each attack follows the steps below.

**Attack mode does not allow instant captures**, even if an undefended arrow also exists.

### Single attack resolution

1. **Compare digits:** Attacker's **attack** digit vs defender's **defense** digit on the clashing arrows.
2. **Attacker wins compare** (attack > defense):
   - Roll **1d6**.
   - **Damage** = `(attack + d6) × 2`
   - Subtract damage from defender's **current HP**.
3. **Tie** (attack = defense):
   - **No damage.** Defender holds.
4. **Attacker loses compare** (attack < defense):
   - **Counter-damage** to the attacker = `(defense − attack) + 1d6`
   - Subtract from attacker's current HP.
   - No chain triggered from a failed attack.

### Defeat and capture

| Capture type | HP condition | Board state | Chains |
|--------------|--------------|-------------|--------|
| **Instant** (Capture mode) | No damage | Flips to captor at **current HP** | No combat chain |
| **Combat** (Attack mode) | HP → 0 | Flips to captor at **1 HP** | **Yes** — captured card may attack |

- When combat reduces a card to **0 HP or below**, it is **captured** by the player who dealt the killing blow.
- The captured card **stays on the board** under the captor's control at **1 HP** (minimum).
- The captor may immediately use the **captured card's arrows** to continue the combo (see [Chain Combos](#chain-combos)).
- Ownership transfer for collection purposes follows the lobby mode regardless of final match outcome.

### Chain combos (combat captures only)

When a card is captured **via combat** (HP → 0):

1. That card flips to the captor at **1 HP** and may attack using **its arrows** in a direction the captor chooses (one mutual-arrow attack per chain step, if valid).
2. If that chain attack defeats another card, **fully resolve** that sub-chain (depth-first) before other pending attacks.
3. After the depth-first subtree completes, resume any remaining attacks from the original placed card (if attack mode and arrows remain) or end the chain step.
4. Repeat until no legal chain attacks remain or limits are hit.

**Depth-first rule:** Always finish the deepest capture branch before returning to shallower pending attacks.

**Chain limits (online):**

| Limit | Value |
|-------|-------|
| Max chain depth | 4 |
| Max resolutions per placement | 12 |

Instant captures in **Capture mode** do **not** trigger combat chains.

### Focus fire

Across a turn and its chains, **multiple friendly cards** may attack the **same target**. Each attack resolves separately. Wounded cards are prime finish targets.

---

## Chain Combos

```
Place card → Attack mode → Arrow 1 damages enemy
         → Arrow 2 kills enemy (HP 0) → card flips at 1 HP
         → Captured card attacks via its arrows → kills another
         → Resolve sub-chain depth-first
         → Return to remaining arrows on placed card
```

- **Captured cards fight for you** — A combat capture at 1 HP can immediately attack with its own arrows.
- **Order matters** — Kill weak cards first to open chains, or soften a legendary before a second attacker.
- **Depth-first** — Fully resolve the deepest capture branch before sibling attacks.
- **Limits** — Max depth 4, max 12 total resolutions per placement turn.

---

## Card Ownership

Choose a lobby mode before the match:

| Mode | Behavior |
|------|----------|
| **Casual** | Captures are in-match only. Collections do not change after the game. |
| **Ranked / stakes** | Captured cards transfer digitally to the winner's collection. |
| **Sandbox** | All players use rented or test cards; no permanent transfers. |

Captured cards **always** transfer per the lobby mode, whether the captor wins or loses the overall match.

---

## Winning the Game

The game ends when **both players have placed all 5 cards** (10 cards total on the grid, accounting for captures removing cards).

**Winner:** Player with the **higher sum of current HP** across all cards they control **on the board**.

| Tiebreaker | Rule |
|------------|------|
| 1st | Most cards on the board |
| 2nd | Highest combined rarity value |
| 3rd | Draw |

**Note:** Only cards **on the board** at game end count toward the HP victory total. Captured-and-flipped cards count for the player who currently controls them.

---

## Advanced Rules (Optional)

### Element bonus (lobby toggle)

When enabled, same-element attackers gain **+1 attack** on the clashing arrow for that hit only.

Optional expansion: elemental advantage chart (e.g., Mountain beats Savanna).

### Special abilities

Higher-rarity cards may include a **once-per-match** ability. Examples:

- **Roar** — Stun one enemy arrow for the next turn (cannot attack or defend).
- **Stampede** — Next attack this turn gains +2 attack before damage calculation.
- **Camouflage** — First attack against this card each match deals −4 damage (minimum 0).

Use sparingly in v1 online play.

### Tabletop 2d6 variant

For slower, swingier physical play, replace `1d6` with `2d6` in the damage formula. Not recommended for online ranked (longer turns).

---

## Quick Start

> Build a team of 5. Take turns placing cards on a 4×4 grid.
> Each arrow has **Attack/Defense** and each card has **HP**.
> Choose **Capture** (free undefended takes) or **Attack** (fight mutual arrows) — not both.
> Attacks: higher **Attack vs Defense** deals `(attack + 1d6) × 2` damage. Loser may take counter-damage.
> HP hits 0 → captured. Chains let you keep fighting — depth-first, up to 4 deep.
> When all cards are placed, **highest total HP on the board** wins.

---

## Design Notes

1. **Teachable in ~5 minutes** — Modes, arrows, and one damage formula; chains add depth over time.
2. **Tactically deep** — Arrow layout, mode choice, attack order, focus fire, and HP preservation all matter.
3. **Tuned for ~8–12 minute online matches** — See numeric tuning; commons fall in 2–3 hits, legendaries need coordinated focus fire.
4. **Legally distinct** — Directional grid genre is shared; HP + dice + attack/defense split + mode fork + HP victory condition is original expression.

---

## Numeric Tuning (v2.0)

Official ranges for generated card stats. Values are hex unless noted.

### Health (HP) by rarity

| Rarity | HP range (hex) | HP range (decimal) | Mean target |
|--------|----------------|----------------------|-------------|
| Common | `0x10`–`0x30` | 16–48 | ~32 |
| Uncommon | `0x28`–`0x50` | 40–80 | ~60 |
| Rare | `0x45`–`0x80` | 69–128 | ~100 |
| Ultra Rare | `0x70`–`0xC0` | 112–192 | ~150 |
| Secret Rare | `0xA0`–`0xF0` | 160–240 | ~200 |
| Legendary | `0xC0`–`0x180` | 192–384 | ~280 |

**Hard cap:** `0x180` (384 decimal). Do not use full `0xFFF` except as a display rarity flourish — not for gameplay.

### Arrow count by rarity

| Rarity | Arrows | Notes |
|--------|--------|-------|
| Common | 1–3 | At least 1 arrow required on every card |
| Uncommon | 2–4 | |
| Rare | 3–5 | |
| Ultra Rare | 4–6 | |
| Secret Rare | 5–7 | |
| Legendary | 6–8 | Peak at 8 |

### Attack / defense per arrow by rarity

| Rarity | Attack range | Defense range | Design note |
|--------|--------------|---------------|-------------|
| Common | 1–5 | 1–5 | One strong side, one weak side |
| Uncommon | 2–7 | 2–7 | |
| Rare | 4–9 | 4–9 | |
| Ultra Rare | 6–12* | 6–12* | *Treat `A`=10, `B`=11, `C`=12 in generation; store as hex `A`–`C` |
| Secret Rare | 6–D | 6–D | |
| Legendary | 7–F | 7–F | One arrow may reach `F`; no arrow should be `F/F` on launch cards |

**Balance rule:** Sum of all attack digits on a card ≤ `(arrow count × rarity cap)` per internal generator. No perfect arrows (`F/F`) at launch.

### Damage formula

| Step | Formula |
|------|---------|
| Hit damage | `(attack + 1d6) × 2` |
| Counter damage | `(defense − attack) + 1d6` (only when attack < defense) |
| Minimum damage | 1 (if formula yields 0 or less, round up to 1) |
| Tie | No damage |

| Roll | Min hit | Max hit (attack F=15) |
|------|---------|------------------------|
| 1d6 = 1 | `(A+1)×2` | 32 |
| 1d6 = 6 | `(A+6)×2` | 42 |

### Expected hits to defeat (solo attacker)

Assumes `(attack + 3.5) × 2` average damage (fair d6 mean):

| Defender rarity | ~HP | ~Atk facing | Avg damage/hit | Solo hits |
|-----------------|-----|-------------|----------------|-----------|
| Common | 32 | 4 | 15 | **2–3** |
| Uncommon | 60 | 6 | 19 | **3–4** |
| Rare | 100 | 8 | 23 | **4–5** |
| Ultra Rare | 150 | 9 | 25 | **6** |
| Secret Rare | 200 | 10 | 27 | **7–8** |
| Legendary | 280 | 11 | 29 | **9–10** |

**Design intent:** A lone common cannot solo a legendary before the match ends. Legendaries require **focus fire** or **chain setups** — correct for rarity fantasy.

### Focus fire example

Two rare cards (attack 9 each) focus a legendary (280 HP):

- Average damage per hit ≈ 25
- Four combined hits ≈ 100 damage
- Legendary still at ~180 HP — needs **continued pressure** or **high rolls** across several turns. ✓

### Common vs common trade

Both ~32 HP, attack 4 vs defense 4:

- Tie → no damage → positioning and multiple arrows matter
- Attack 5 vs defense 3: avg damage `(5+3.5)×2` ≈ 17 → **2 hits** to capture ✓

### Placement mode decision (examples)

| Situation | Modes available | Best play depends on |
|-----------|-----------------|----------------------|
| 2 undefended arrows, 0 mutual | Capture only | Free double capture — usually take it |
| 0 undefended, 2 mutual | Attack only | Softening or killing key threat |
| 1 undefended, 1 mutual | **Player chooses** | Free capture vs fighting defended target |
| 0 undefended, 0 mutual | Neither | Placement for future chains only |

### Chain and turn limits

| Parameter | Value | Reason |
|-----------|-------|--------|
| Max chain depth | 4 | Prevents runaway recursion |
| Max resolutions / placement | 12 | Keeps mobile turns under ~60s |
| Cards per player | 5 | 10 placements per match |
| Grid | 4×4 | Room for positioning without emptiness |

### Rarity weighting (generation pseudocode)

```
hp      = weighted_random(rarity_hp_min, rarity_hp_max, skew=toward_high_for_rare)
arrows  = weighted_random(rarity_arrow_min, rarity_arrow_max, skew=toward_high_for_rare)
for each arrow:
  attack  = weighted_random(rarity_atk_min, rarity_atk_max, skew=toward_high_for_rare)
  defense = weighted_random(rarity_def_min, rarity_def_max, skew=toward_high_for_rare)
enforce: at least one arrow; no F/F arrow; directional variance (max − min ≥ 2 across arrows)
```

### Online vs physical defaults

| Setting | Online PvP | Tabletop |
|---------|------------|----------|
| Dice | 1d6 | 1d6 or 2d6 (house rule) |
| Chain depth cap | 4 | 4 (recommended) |
| Resolutions cap | 12 | Optional |
| Element bonus | Lobby toggle | Opt-in |
| Ownership | Casual / Ranked / Sandbox | Physical trade after match |

---

## Worked Example (one attack)

**Placed card** (Rare lion) attacks north into **enemy zebra** (Common).

| | Attack arrow (N) | Defense arrow (S on zebra) |
|---|------------------|----------------------------|
| Digits | `9` / `4` | `3` / `5` |
| Compare | 9 > 5 → attacker wins | |

- Roll d6 → **4**
- Damage = `(9 + 4) × 2` = **26**
- Zebra HP: `0x28` (40) − 26 = **14 HP remaining**
- No capture yet; zebra can be finished on a later attack or chain.

---

## License

Rules and game system © Magical Industries. See repository license for code and assets.
