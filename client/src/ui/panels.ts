import type { ChainAttackOption, PlacementMode } from "@magicalindustries/realm-clash-core";
import type { ControllerSnapshot } from "../game-controller.js";
import { liveScores, playerLabel } from "../game-controller.js";

export interface PanelElements {
  status: HTMLElement;
  actionHint: HTMLElement;
  modeActions: HTMLElement;
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
    onChain: (option: ChainAttackOption) => void;
  },
): void {
  const { state, phase } = snapshot;
  const current = state.currentPlayer;

  panels.status.textContent =
    state.status === "finished"
      ? `Match finished — ${state.winner === "draw" ? "Draw" : playerLabel(state.winner as 0 | 1)} wins`
      : state.pending
        ? `${playerLabel(current)} — resolve chain`
        : `${playerLabel(current)} to play · Turn ${state.turnNumber}`;

  panels.actionHint.textContent = hintForPhase(snapshot);
  panels.scores.innerHTML = scoreHtml(state);

  panels.eventLog.innerHTML = snapshot.eventLog
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");

  renderModeActions(panels, snapshot, handlers.onMode);
  renderChainActions(panels, snapshot, handlers.onChain);
}

function hintForPhase(snapshot: ControllerSnapshot): string {
  switch (snapshot.phase) {
    case "select_card":
      return "Drag a card onto the board, or tap a card then tap a cell.";
    case "select_cell":
      return "Drag onto a highlighted cell, or tap an empty cell on the board.";
    case "select_mode":
      return "Choose Capture (free takes) or Attack (mutual-arrow battles).";
    case "select_chain":
      return "Choose which chain attack to resolve next.";
    case "game_over":
      return "Match complete. Start a new game to play again.";
    default:
      return "";
  }
}

function scoreHtml(state: ControllerSnapshot["state"]): string {
  const text = liveScores(state);
  const [p0, p1] = text.split(" · ");
  return `
    <div class="score-row"><span class="label-p0">Player 1</span><span>${escapeHtml(p0 ?? "")}</span></div>
    <div class="score-row"><span class="label-p1">Player 2</span><span>${escapeHtml(p1 ?? "")}</span></div>
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

function renderChainActions(
  panels: PanelElements,
  snapshot: ControllerSnapshot,
  onChain: (option: ChainAttackOption) => void,
): void {
  panels.chainActions.innerHTML = "";
  const pending = snapshot.state.pending;
  if (snapshot.phase !== "select_chain" || !pending) {
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