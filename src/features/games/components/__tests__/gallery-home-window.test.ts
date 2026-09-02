import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { GalleryHomeWindow } from "../gallery-home-window";

vi.mock("next/image", () => ({
  default: ({ src, alt, className }: Record<string, string>) =>
    createElement("img", { src, alt, className }),
}));

describe("GalleryHomeWindow", () => {
  it("renders the approved city and glass layers with an accessible home link", () => {
    const markup = renderToStaticMarkup(createElement(GalleryHomeWindow));
    expect(markup).toContain('href="/"');
    expect(markup).toContain('aria-label="Return home"');
    for (const filename of ["city.jpg", "left-glass.png", "right-glass.png"]) {
      expect(markup).toContain(`src="/games/window/${filename}"`);
    }
    expect(markup).toContain('alt=""');
    expect(markup).toContain("Return home</span>");
    expect(markup).not.toContain("Curated Game Catalog");
    expect(markup).not.toContain("Browse published games");
    expect(markup).not.toContain("<audio");
    expect(markup).toContain("<canvas");
    expect(markup).toContain('aria-label="Pause rain animation"');
    expect(markup).toContain('data-paused="false"');
    expect(markup).not.toContain("/games/preview/urban-rain");
  });
});
