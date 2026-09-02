import { describe, expect, it } from "vitest";

import { createReviewStickerLayout } from "../review-sticker-layout";

describe("createReviewStickerLayout", () => {
  it("keeps the same route visually stable", () => {
    expect(createReviewStickerLayout("/reviews/preview")).toEqual(
      createReviewStickerLayout("/reviews/preview"),
    );
  });

  it("varies the layout between routes without repeating artwork", () => {
    const firstLayout = createReviewStickerLayout("/reviews/preview");
    const secondLayout = createReviewStickerLayout(
      "/reviews/preview/rain-archive",
    );

    expect(firstLayout).not.toEqual(secondLayout);
    expect(new Set(firstLayout.map(({ name }) => name)).size).toBe(8);
    expect(firstLayout.filter(({ side }) => side === "left")).toHaveLength(4);
    expect(firstLayout.filter(({ side }) => side === "right")).toHaveLength(4);
  });

  it("keeps stickers inside the safe side-rail ranges", () => {
    const layout = createReviewStickerLayout("/reviews/preview");

    for (const sticker of layout) {
      expect(sticker.top).toBeGreaterThanOrEqual(13);
      expect(sticker.top).toBeLessThanOrEqual(88);
      expect(sticker.offset).toBeGreaterThanOrEqual(14);
      expect(sticker.offset).toBeLessThanOrEqual(54);
      expect(sticker.size).toBeGreaterThanOrEqual(54);
      expect(sticker.size).toBeLessThanOrEqual(84);
      expect(Math.abs(sticker.rotation)).toBeGreaterThanOrEqual(5);
      expect(Math.abs(sticker.rotation)).toBeLessThanOrEqual(23);
    }
  });
});
