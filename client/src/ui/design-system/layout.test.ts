import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const layoutCss = readFileSync(
  resolve(import.meta.dirname, "layout.css"),
  "utf8",
);

describe("arena layout styles", () => {
  it("constrains the arena page to the viewport", () => {
    expect(layoutCss).toMatch(/\.page--arena\s*\{[^}]*height:\s*100dvh/);
    expect(layoutCss).toMatch(/\.page--arena\s+\.app-main\s*\{[^}]*overflow:\s*hidden/);
  });

  it("uses fixed chrome on large screens", () => {
    expect(layoutCss).toMatch(/@media\s*\(min-width:\s*901px\)\s*\{[\s\S]*\.app-header\s*\{[^}]*position:\s*fixed/);
    expect(layoutCss).toMatch(/@media\s*\(min-width:\s*901px\)\s*\{[\s\S]*\.app-footer\s*\{[^}]*position:\s*fixed/);
  });

  it("keeps the sidebar and event log scrollable instead of growing the page", () => {
    expect(layoutCss).toMatch(/\.sidebar\s*\{[^}]*overflow:\s*hidden/);
    expect(layoutCss).toMatch(/\.arena-layout\s*\{[^}]*overflow:\s*hidden/);
  });
});