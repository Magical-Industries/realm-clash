import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { runMatchSetupModal } from "./match-setup-modal.js";

describe("runMatchSetupModal", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.classList.remove("modal-open");
    document.body.innerHTML = "";
  });

  it("returns null when cancelled", async () => {
    const done = runMatchSetupModal({ mode: "cpu", difficulty: "medium" });
    document.querySelector<HTMLButtonElement>("[data-match-setup-cancel]")?.click();
    await expect(done).resolves.toBeNull();
  });

  it("hides difficulty when PvP is selected", async () => {
    const done = runMatchSetupModal({ mode: "cpu", difficulty: "medium" });
    document.querySelector<HTMLButtonElement>('[data-mode="pvp"]')?.click();

    expect(document.querySelector("[data-difficulty-section]")?.classList.contains("hidden")).toBe(
      true,
    );

    document.querySelector<HTMLButtonElement>("[data-match-setup-cancel]")?.click();
    await done;
  });

  it("returns chosen mode and difficulty on continue", async () => {
    const done = runMatchSetupModal({ mode: "pvp", difficulty: "easy" });
    document.querySelector<HTMLButtonElement>('[data-mode="cpu"]')?.click();
    document.querySelector<HTMLButtonElement>('[data-difficulty="hard"]')?.click();
    document.querySelector<HTMLButtonElement>("[data-match-setup-continue]")?.click();

    await expect(done).resolves.toEqual({ mode: "cpu", difficulty: "hard" });
  });
});