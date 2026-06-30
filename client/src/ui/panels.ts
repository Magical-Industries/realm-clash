import type { ChainAttackOption, Direction, PlacementMode } from "@magicalindustries/realm-clash-core";
import type { ControllerSnapshot } from "../game-controller.js";
import { liveScores, playerLabel } from "../game-controller.js";

const DIRECTION_LABELS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export interface PanelElements {
  status: HTMLElement;
  actionHint: HTMLElement;
  modeActions: HTMLElement;
  attackOrderActions: HTMLElement;
  chainActions: HTMLElement;
  scores: HTMLElement;
  eventLog: HTMLElement;
  newGameButton: HTMLButtonElement;
}

export function bindPanels(root: Document = document): PanelElements {
  return {
    status: root.getElementById("status")!,
    actionHint: root.getElementById("action-hint")!,
    modeActions: root.getElementById("mode-actions")!,
    attackOrderActions: root.getElementById("attack-order-actions")!,
    chainActions: root.getElementById("chain-actions")!,
    scores: root.getElementById("scores")!,
    eventLog: root.getElementById("event-log")!,
    newGameButton: root.getElementById("new-game") as HTMLButtonElement,
  };
}

export function renderPanels(
  panels: PanelElements,
  snapshot: ControllerSnapshot,
  handlers: {
    onMode: (mode: PlacementMode) => void;
    onAttackTarget: (direction: Direction) => void;
    onUndoAttackOrder: () => void;
    onChain: (option: ChainAttackOption) => void;
  },
): void {
  const { state, phase, matchMode } = snapshot;
  const current = state.currentPlayer;
  const chainActor = state.pending?.captor;

  panels.status.textContent =
    state.status === "finished"
      ? `Match finished — ${state.winner === "draw" ? "Draw" : playerLabel(state.winner as 0 | 1, matchMode)} wins`
      : state.pending && chainActor !== undefined
        ? `${playerLabel(chainActor, matchMode)} — resolve chain`
        : phase === "select_attack_order"
          ? `${playerLabel(current, matchMode)} — set attack order`
          : `${playerLabel(current, matchMode)} to play · Turn ${state.turnNumber}`;

  panels.actionHint.textContent = hintForPhase(snapshot);
  panels.scores.innerHTML = scoreHtml(snapshot);

  panels.eventLog.innerHTML = snapshot.eventLog
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");

  renderModeActions(panels, snapshot, handlers.onMode);
  renderAttackOrderActions(panels, snapshot, handlers);
  renderChainActions(panels, snapshot, handlers.onChain);
}

function hintForPhase(snapshot: ControllerSnapshot): string {
  const { matchMode, phase, state } = snapshot;

  if (matchMode === "cpu" && phase !== "game_over") {
    if (phase === "select_chain" && state.pending?.captor === 0) {
      return "Computer is resolving the chain…";
    }
    if (phase === "select_attack_order" && state.currentPlayer === 0) {
      return "Computer is choosing attack order…";
    }
    if (!state.pending && state.currentPlayer === 0) {
      return "Computer is thinking…";
    }
  }

  switch (phase) {
    case "select_card":
      return "Drag a card onto the board, or tap a card then tap a cell.";
    case "select_cell":
      return "Drag onto a highlighted cell, or tap an empty cell on the board.";
    case "select_mode":
      return "Choose Capture (free takes) or Attack (mutual-arrow battles).";
    case "select_attack_order":
      return "Tap targets in the order you want mutual attacks to resolve.";
    case "select_chain":
      return "Choose which chain attack to resolve next.";
    case "game_over":
      return "Match complete. Start a new game to play again.";
    default:
      return "";
  }
}

function scoreHtml(snapshot: ControllerSnapshot): string {
  const text = liveScores(snapshot.state, snapshot.matchMode);
  const [p0, p1] = text.split(" · ");
  return `
    <div class="score-row"><span class="label-p0">${escapeHtml(playerLabel(0, snapshot.matchMode))}</span><span>${escapeHtml(p0 ?? "")}</span></div>
    <div class="score-row"><span class="label-p1">${escapeHtml(playerLabel(1, snapshot.matchMode))}</span><span>${escapeHtml(p1 ?? "")}</span></div>
  `;
}

function renderModeActions(
  panels: PanelElements,
  snapshot: ControllerSnapshot,
  onMode: (mode: PlacementMode) => void,
): void {
  panels.modeActions.innerHTML = "";
  if (snapshot.phase !== "select_mode") {
    panels.modeActions.classList.add("hidden");
    return;
  }

  panels.modeActions.classList.remove("hidden");
  for (const mode of snapshot.availableModes.filter((m) => m !== "none")) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `btn ${mode === "attack" ? "primary" : ""}`;
    btn.textContent = mode === "capture" ? "Capture mode" : "Attack mode";
    btn.addEventListener("click", () => onMode(mode));
    panels.modeActions.appendChild(btn);
  }
}

function directionLabel(direction: Direction): string {
  return DIRECTION_LABELS[direction] ?? `D${direction}`;
}

function renderAttackOrderActions(
  panels: PanelElements,
  snapshot: ControllerSnapshot,
  handlers: {
    onAttackTarget: (direction: Direction) => void;
    onUndoAttackOrder: () => void;
  },
): void {
  panels.attackOrderActions.innerHTML = "";

  const humanTurn =
    snapshot.state.currentPlayer === snapshot.humanPlayer &&
    !snapshot.state.pending;
  if (snapshot.phase !== "select_attack_order" || !humanTurn) {
    panels.attackOrderActions.classList.add("hidden");
    return;
  }

  panels.attackOrderActions.classList.remove("hidden");

  const picked = new Set(snapshot.attackArrowOrder);
  const remaining = snapshot.mutualAttacks.filter((attack) => !picked.has(attack.direction));

  const orderedHtml =
    snapshot.attackArrowOrder.length === 0
      ? `<p class="attack-order__empty body-sm">No attacks chosen yet.</p>`
      : `<ol class="attack-order__list">
          ${snapshot.attackArrowOrder
            .map((direction, index) => {
              const attack = snapshot.mutualAttacks.find((item) => item.direction === direction);
              if (!attack) return "";
              return `<li>
                <span class="attack-order__step">${index + 1}</span>
                ${directionLabel(direction)} → ${escapeHtml(attack.defenderInstanceId)}
                @ (${attack.defenderPosition.row},${attack.defenderPosition.col})
              </li>`;
            })
            .join("")}
        </ol>`;

  panels.attackOrderActions.innerHTML = `
    <div class="attack-order">
      <p class="label">Attack order</p>
      ${orderedHtml}
      <div class="attack-order__remaining">
        ${remaining
          .map((attack) => {
            const nextStep = snapshot.attackArrowOrder.length + 1;
            return `<button
              type="button"
              class="btn btn--primary attack-order__pick"
              data-direction="${attack.direction}"
            >
              ${nextStep}. Attack ${directionLabel(attack.direction)} → ${escapeHtml(attack.defenderInstanceId)}
            </button>`;
          })
          .join("")}
      </div>
      ${
        snapshot.attackArrowOrder.length > 0
          ? `<button type="button" class="btn btn--ghost attack-order__undo">Undo last</button>`
          : ""
      }
    </div>
  `;

  panels.attackOrderActions.querySelectorAll<HTMLButtonElement>("[data-direction]").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = Number(button.dataset.direction) as Direction;
      handlers.onAttackTarget(direction);
    });
  });

  panels.attackOrderActions
    .querySelector<HTMLButtonElement>(".attack-order__undo")
    ?.addEventListener("click", handlers.onUndoAttackOrder);
}

function renderChainActions(
  panels: PanelElements,
  snapshot: ControllerSnapshot,
  onChain: (option: ChainAttackOption) => void,
): void {
  panels.chainActions.innerHTML = "";
  const pending = snapshot.state.pending;
  const humanPlayer = snapshot.humanPlayer;
  if (
    snapshot.phase !== "select_chain" ||
    !pending ||
    pending.captor !== humanPlayer
  ) {
    panels.chainActions.classList.add("hidden");
    return;
  }

  panels.chainActions.classList.remove("hidden");
  for (const option of pending.options) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn primary";
    btn.textContent = `${option.attackerInstanceId} → D${option.direction} @ (${option.defenderPosition.row},${option.defenderPosition.col})`;
    btn.addEventListener("click", () => onChain(option));
    panels.chainActions.appendChild(btn);
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}