import { describe, expect, it } from "vitest";

import { createReviewOutline } from "@/features/reviews/utils/review-outline";

function heading(tag: "h2" | "h3" | "h4", text: string) {
  return {
    children: [{ text, type: "text", version: 1 }],
    direction: null,
    format: "",
    indent: 0,
    tag,
    type: "heading",
    version: 1,
  };
}

describe("createReviewOutline", () => {
  it("extracts h2-h4 headings and creates stable unicode ids", () => {
    const firstHeading = heading("h2", "叙事 与 世界");
    const body = {
      root: {
        children: [
          firstHeading,
          heading("h3", "Design & Play"),
          heading("h2", "叙事 与 世界"),
        ],
        direction: null,
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    };

    const result = createReviewOutline(
      body as Parameters<typeof createReviewOutline>[0],
    );

    expect(result.items).toEqual([
      { id: "叙事-与-世界", level: 2, text: "叙事 与 世界" },
      { id: "design-play", level: 3, text: "Design & Play" },
      { id: "叙事-与-世界-2", level: 2, text: "叙事 与 世界" },
    ]);
    expect(result.headingIds.get(firstHeading)).toBe("叙事-与-世界");
  });

  it("ignores empty and non-heading nodes", () => {
    const body = {
      root: {
        children: [
          { children: [], type: "paragraph", version: 1 },
          heading("h4", "   "),
        ],
        direction: null,
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    };

    expect(
      createReviewOutline(body as Parameters<typeof createReviewOutline>[0])
        .items,
    ).toEqual([]);
  });
});
