import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const componentsCss = readFileSync(
  resolve(import.meta.dirname, "components.css"),
  "utf8",
);

describe("arena component styles", () => {
  it("caps chain action height so the board is not pushed down", () => {
    expect(componentsCss).toMatch(/\.chain-actions\s*\{[^}]*max-height:/);
    expect(componentsCss).toMatch(/\.chain-actions\s*\{[^}]*overflow-y:\s*auto/);
  });

  it("lays out hand reveal footer actions with shuffle support", () => {
    expect(componentsCss).toMatch(/\.hand-reveal__footer\s*\{[^}]*justify-content:\s*space-between/);
  });
});