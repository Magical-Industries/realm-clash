import { describe, expect, it } from "vitest";

import { chainChoiceFixture, TestableGameController } from "./test-fixtures.js";

describe("GameController", () => {
  it("treats CPU chain captor as an active computer turn even when human is current player", () => {
    const controller = new TestableGameController({ mode: "cpu" });
    controller.setTestState(chainChoiceFixture(), "select_chain");

    expect(controller.isComputerTurn()).toBe(true);
  });

  it("auto-resolves chain attacks as the captor without captor errors", () => {
    const controller = new TestableGameController({ mode: "cpu" });
    controller.setTestState(chainChoiceFixture(), "select_chain");

    controller.runComputerTurn();

    const snapshot = controller.getSnapshot();
    expect(snapshot.eventLog.some((line) => line.includes("Only the captor"))).toBe(false);
    expect(snapshot.state.pending).toBeNull();
    expect(snapshot.phase).toBe("select_card");
  });

  it("reshuffles dealt hands on an empty board", () => {
    const controller = new TestableGameController({ mode: "cpu" });
    const before = controller.getSnapshot().state.hands[1].map((card) => card.template.id);

    expect(controller.reshuffleDealtHands()).toBe(true);

    const after = controller.getSnapshot().state.hands[1].map((card) => card.template.id);
    expect(after).not.toEqual(before);
  });

  it("refuses to reshuffle once cards are on the board", () => {
    const controller = new TestableGameController({ mode: "cpu" });
    controller.setTestState(chainChoiceFixture(), "select_chain");

    expect(controller.reshuffleDealtHands()).toBe(false);
  });

  it("enters attack-order selection when attack mode has multiple mutual targets", () => {
    const controller = new TestableGameController({ mode: "cpu" });
    controller.setTestPlacementContext({
      phase: "select_mode",
      selectedCardId: "p1-0",
      selectedPosition: { row: 1, col: 1 },
      mutualAttacks: [
        {
          direction: 0,
          defenderInstanceId: "north-board",
          defenderPosition: { row: 0, col: 1 },
          attackValue: 8,
          defenseValue: 2,
        },
        {
          direction: 4,
          defenderInstanceId: "south-board",
          defenderPosition: { row: 2, col: 1 },
          attackValue: 7,
          defenseValue: 3,
        },
      ],
    });

    controller.chooseMode("attack");

    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe("select_attack_order");
    expect(snapshot.attackArrowOrder).toEqual([]);
  });

  it("reports the live deck from opening hand, board, and captures", () => {
    const controller = new TestableGameController({ mode: "cpu" });
    const initial = controller.getSnapshot().state.hands[1];
    controller.setTestInitialHands(1, initial);

    const deck = controller.getPlayerDeck(1);
    expect(deck).toHaveLength(initial.length);
    expect(deck.every((entry) => entry.status === "in_hand")).toBe(true);
  });

  it("builds attack order step by step and supports undo", () => {
    const controller = new TestableGameController({ mode: "cpu" });
    controller.setTestPlacementContext({
      phase: "select_attack_order",
      selectedCardId: "p1-0",
      selectedPosition: { row: 1, col: 1 },
      mutualAttacks: [
        {
          direction: 0,
          defenderInstanceId: "north-board",
          defenderPosition: { row: 0, col: 1 },
          attackValue: 8,
          defenseValue: 2,
        },
        {
          direction: 2,
          defenderInstanceId: "east-board",
          defenderPosition: { row: 1, col: 2 },
          attackValue: 7,
          defenseValue: 3,
        },
      ],
    });

    controller.pickAttackTarget(2);
    expect(controller.getSnapshot().attackArrowOrder).toEqual([2]);

    controller.pickAttackTarget(0);
    expect(controller.getSnapshot().attackArrowOrder).toEqual([2, 0]);

    controller.undoLastAttackTarget();
    expect(controller.getSnapshot().attackArrowOrder).toEqual([2]);
    expect(controller.getSnapshot().phase).toBe("select_attack_order");
  });
});