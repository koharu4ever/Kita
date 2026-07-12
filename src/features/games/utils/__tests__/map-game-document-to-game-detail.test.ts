import { describe, expect, it } from "vitest";

import { mapGameDocumentToGameDetail } from "@/features/games/utils/map-game-document-to-game-detail";
import { createPayloadGameDocument } from "@/testing/fixtures/payload-documents";

describe("mapGameDocumentToGameDetail", () => {
  it("maps game fields, cover metadata, tags, and links", () => {
    const result = mapGameDocumentToGameDetail(
      createPayloadGameDocument({
        links: [{ href: "https://vndb.org/v1", id: "link-1", label: "VNDB" }],
        tags: [
          { id: "tag-1", label: "Drama" },
          { id: "tag-2", label: "Winter" },
        ],
      }),
    );

    expect(result).toMatchObject({
      cover: {
        alt: "Test game cover",
        height: 1200,
        src: "/games/covers/test-game.jpg",
        width: 1920,
      },
      links: [{ href: "https://vndb.org/v1", label: "VNDB" }],
      slug: "test-game",
      tags: ["Drama", "Winter"],
      title: "Test Game",
    });
  });

  it("maps nullable tags, links, and original title safely", () => {
    const result = mapGameDocumentToGameDetail(
      createPayloadGameDocument({
        links: null,
        originalTitle: null,
        tags: null,
      }),
    );

    expect(result.links).toEqual([]);
    expect(result.originalTitle).toBeUndefined();
    expect(result.tags).toEqual([]);
  });
});
