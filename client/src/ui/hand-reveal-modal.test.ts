import type { HandCard } from "@magicalindustries/realm-clash-core";
import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { cardTemplate, handCards } from "../test-fixtures.js";
import { runHandRevealSequence } from "./hand-reveal-modal.js";

function sampleHand(label: string): HandCard[] {
  return handCards(label, [
    cardTemplate(`${label}-lion`, 32, [{ direction: 0, attack: 5, defense: 3 }]),
    cardTemplate(`${label}-zebra`, 28, [{ direction: 2, attack: 4, defense: 4 }]),
  ]);
}

describe("runHandRevealSequence", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.classList.remove("modal-open");
    document.body.innerHTML = "";
  });

  it("omits the shuffle button when no shuffle handler is provided", async () => {
    const done = runHandRevealSequence([
      {
        title: "Your Hand",
        subtitle: "Review cards",
        buttonLabel: "Start",
        cards: sampleHand("a"),
      },
    ]);

    expect(document.querySelector("[data-hand-reveal-shuffle]")).toBeNull();
    document.querySelector<HTMLButtonElement>("[data-hand-reveal-continue]")?.click();
    await done;
  });

  it("renders shuffle and refreshes cards when shuffle is clicked", async () => {
    let shuffleCalls = 0;
    const done = runHandRevealSequence(
      [
        {
          title: "Your Hand",
          subtitle: "Review cards",
          buttonLabel: "Start",
          cards: sampleHand("before"),
        },
      ],
      {
        onShuffle: () => {
          shuffleCalls += 1;
          return sampleHand("after");
        },
      },
    );

    const shuffleButton = document.querySelector<HTMLButtonElement>("[data-hand-reveal-shuffle]");
    expect(shuffleButton).not.toBeNull();

    shuffleButton?.click();
    expect(shuffleCalls).toBe(1);

    const names = [...document.querySelectorAll(".hand-reveal-card__name")].map(
      (node) => node.textContent,
    );
    expect(names).toContain("after-lion");
    expect(names).not.toContain("before-lion");

    document.querySelector<HTMLButtonElement>("[data-hand-reveal-continue]")?.click();
    await done;
  });
});