import type { ControllerSnapshot } from "../game-controller.js";
import { describe, expect, it, beforeEach } from "vitest";

import { chainChoiceFixture } from "../test-fixtures.js";
import { bindPanels, renderPanels, type PanelElements } from "./panels.js";

function baseSnapshot(overrides: Partial<ControllerSnapshot> = {}): ControllerSnapshot {
  const state = chainChoiceFixture();
  return {
    state,
    phase: "select_chain",
    matchMode: "cpu",
    realmId: "wildlife",
    difficulty: "medium",
    humanPlayer: 1,
    selectedCardId: null,
    selectedPosition: null,
    availableModes: ["none"],
    mutualDirections: [],
    mutualAttacks: [],
    attackArrowOrder: [],
    eventLog: [],
    ...overrides,
  };
}

const noopHandlers = {
  onMode: () => {},
  onAttackTarget: () => {},
  onUndoAttackOrder: () => {},
  onChain: () => {},
};

function mountPanelDom(): PanelElements {
  document.body.innerHTML = `
    <div id="status"></div>
    <div id="action-hint"></div>
    <div id="mode-actions" class="hidden"></div>
    <div id="attack-order-actions" class="hidden"></div>
    <div id="chain-actions" class="hidden"></div>
    <div id="scores"></div>
    <ol id="event-log"></ol>
    <button id="new-game" type="button"></button>
  `;
  return bindPanels();
}

describe("renderPanels", () => {
  let panels: PanelElements;

  beforeEach(() => {
    panels = mountPanelDom();
  });

  it("shows the chain captor in status, not the current player", () => {
    renderPanels(panels, baseSnapshot(), noopHandlers);

    expect(panels.status.textContent).toBe("Computer — resolve chain");
  });

  it("hides chain buttons when the computer is the captor", () => {
    renderPanels(panels, baseSnapshot(), noopHandlers);

    expect(panels.chainActions.classList.contains("hidden")).toBe(true);
    expect(panels.chainActions.querySelectorAll("button").length).toBe(0);
  });

  it("shows chain buttons when the human is the captor", () => {
    const state = chainChoiceFixture();
    state.pending!.captor = 1;

    renderPanels(panels, baseSnapshot({ state }), noopHandlers);

    expect(panels.chainActions.classList.contains("hidden")).toBe(false);
    expect(panels.chainActions.querySelectorAll("button").length).toBe(2);
  });

  it("shows a computer chain hint while the CPU resolves", () => {
    renderPanels(panels, baseSnapshot(), noopHandlers);

    expect(panels.actionHint.textContent).toBe("Computer is resolving the chain…");
  });

  it("shows attack-order picks for the human player", () => {
    const mutualAttacks = [
      {
        direction: 0 as const,
        defenderInstanceId: "north-board",
        defenderPosition: { row: 0, col: 1 },
        attackValue: 8,
        defenseValue: 2,
      },
      {
        direction: 4 as const,
        defenderInstanceId: "south-board",
        defenderPosition: { row: 2, col: 1 },
        attackValue: 7,
        defenseValue: 3,
      },
    ];

    const state = chainChoiceFixture();
    state.currentPlayer = 1;
    state.pending = null;

    renderPanels(
      panels,
      baseSnapshot({
        phase: "select_attack_order",
        state,
        mutualAttacks,
        mutualDirections: [0, 4],
        attackArrowOrder: [],
      }),
      noopHandlers,
    );

    expect(panels.attackOrderActions.classList.contains("hidden")).toBe(false);
    expect(panels.attackOrderActions.querySelectorAll("[data-direction]").length).toBe(2);
    expect(panels.actionHint.textContent).toContain("order you want mutual attacks");
  });
});