import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AboutOverlayNav } from "../about-overlay-nav";

describe("About window-veil navigation", () => {
  it("starts with a closed native dialog and an associated trigger", () => {
    const markup = renderToStaticMarkup(createElement(AboutOverlayNav));
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('aria-label="Open navigation menu"');
    expect(markup).toContain('aria-label="About page navigation"');
    expect(markup).toContain('aria-haspopup="dialog"');
    expect(markup).toContain("<dialog");
    expect(markup).toContain('aria-label="Site navigation"');
    expect(markup).not.toMatch(/<dialog[^>]*\sopen(?:=|\s|>)/);
    const navigationId = markup.match(/aria-controls="([^"]+)"/)?.[1];
    expect(navigationId).toBeTruthy();
    expect(markup).toContain(`id="${navigationId}"`);
  });

  it("preserves the four route links and an explicit close control", () => {
    const markup = renderToStaticMarkup(createElement(AboutOverlayNav));
    for (const href of ["/", "/games", "/reviews", "/tools"]) {
      expect(markup).toContain(`href="${href}"`);
    }
    expect(markup).toContain('aria-label="Close navigation menu"');
    expect(markup).not.toContain('role="menu"');
  });
});
