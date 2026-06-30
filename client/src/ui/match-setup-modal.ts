import {
  difficultyLabel,
  type Difficulty,
} from "../match/difficulty.js";
import type { MatchMode } from "../match/types.js";

export interface MatchSetup {
  mode: MatchMode;
  difficulty: Difficulty;
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "legend"];

/** Let the player pick opponent and CPU difficulty before a new match. */
export function runMatchSetupModal(initial: MatchSetup): Promise<MatchSetup | null> {
  return new Promise((resolve) => {
    let mode: MatchMode = initial.mode;
    let difficulty: Difficulty = initial.difficulty;

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "match-setup-title");

    const renderDifficulty = (): string =>
      DIFFICULTIES.map((level) => {
        const active = level === difficulty ? " match-setup__choice--active" : "";
        const variant =
          level === "easy"
            ? "btn--primary"
            : level === "legend"
              ? "btn--danger"
              : "btn--secondary";
        return `<button type="button" class="btn btn--sm ${variant} match-setup__choice${active}" data-difficulty="${level}">${difficultyLabel(level)}</button>`;
      }).join("");

    const render = (): void => {
      const pvpActive = mode === "pvp" ? " match-setup__choice--active" : "";
      const cpuActive = mode === "cpu" ? " match-setup__choice--active" : "";
      const difficultyHidden = mode === "pvp" ? " hidden" : "";

      overlay.innerHTML = `
        <div class="modal surface-card match-setup-modal">
          <header class="modal__header">
            <h2 class="heading-2" id="match-setup-title">New match</h2>
            <p class="body-sm">Choose your opponent. CPU difficulty affects how strong cards each side is dealt.</p>
          </header>
          <div class="match-setup__section">
            <p class="label">Opponent</p>
            <div class="match-setup__row">
              <button type="button" class="btn btn--secondary match-setup__choice${pvpActive}" data-mode="pvp">Play vs Friend</button>
              <button type="button" class="btn btn--secondary match-setup__choice${cpuActive}" data-mode="cpu">Vs Computer</button>
            </div>
          </div>
          <div class="match-setup__section${difficultyHidden}" data-difficulty-section>
            <p class="label">CPU difficulty</p>
            <div class="match-setup__row match-setup__row--wrap">${renderDifficulty()}</div>
          </div>
          <footer class="modal__footer match-setup__footer">
            <button type="button" class="btn btn--ghost" data-match-setup-cancel>Cancel</button>
            <button type="button" class="btn btn--primary" data-match-setup-continue>Deal cards</button>
          </footer>
        </div>
      `;
    };

    render();
    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");

    const finish = (result: MatchSetup | null): void => {
      overlay.remove();
      if (!document.querySelector(".modal-overlay")) {
        document.body.classList.remove("modal-open");
      }
      resolve(result);
    };

    const bind = (): void => {
      overlay.querySelector<HTMLButtonElement>("[data-match-setup-continue]")?.focus();

      overlay.querySelector("[data-match-setup-continue]")?.addEventListener("click", () => {
        finish({ mode, difficulty });
      });

      overlay.querySelector("[data-match-setup-cancel]")?.addEventListener("click", () => {
        finish(null);
      });

      overlay.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
        button.addEventListener("click", () => {
          mode = button.dataset.mode === "cpu" ? "cpu" : "pvp";
          render();
          bind();
        });
      });

      overlay.querySelectorAll<HTMLButtonElement>("[data-difficulty]").forEach((button) => {
        button.addEventListener("click", () => {
          const level = button.dataset.difficulty;
          if (level && DIFFICULTIES.includes(level as Difficulty)) {
            difficulty = level as Difficulty;
            render();
            bind();
          }
        });
      });
    };

    bind();

    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") finish(null);
    });
  });
}