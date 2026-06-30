import { describe, expect, it } from "vitest";

import { renderShell } from "./shell.js";

describe("renderShell", () => {
  it("adds page--arena on the play route", () => {
    const html = renderShell({ activeRoute: "play", showBottomNav: false });

    expect(html).toContain('class="page--arena"');
  });

  it("does not add page--arena on marketing routes", () => {
    const html = renderShell({ activeRoute: "home" });

    expect(html).not.toContain("page--arena");
  });

  it("keeps bottom navigation markup on marketing routes by default", () => {
    const html = renderShell({ activeRoute: "home" });

    expect(html).toContain('class="bottom-nav"');
  });
});