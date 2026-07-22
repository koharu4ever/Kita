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
        src: "https://media.example.com/media/test-game.jpg",
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

  it("prefers the display-sized Payload Media cover", () => {
    const result = mapGameDocumentToGameDetail(
      createPayloadGameDocument({
        cover: {
          alt: "Payload-managed cover",
          createdAt: "2026-07-21T00:00:00.000Z",
          id: 42,
          sizes: {
            display: {
              height: 900,
              url: "https://media.example.com/media/game-display.webp",
              width: 1600,
            },
          },
          updatedAt: "2026-07-21T00:00:00.000Z",
          url: "https://media.example.com/media/game-original.png",
          width: 2400,
          height: 1350,
        },
      }),
    );

    expect(result.cover).toEqual({
      alt: "Payload-managed cover",
      height: 900,
      src: "https://media.example.com/media/game-display.webp",
      width: 1600,
    });
  });

  it("fails explicitly when the Media relation is not populated", () => {
    expect(() =>
      mapGameDocumentToGameDetail(createPayloadGameDocument({ cover: 42 })),
    ).toThrow('Game "test-game" has no resolvable Media cover');
  });

  it("fails explicitly when Media has no usable image metadata", () => {
    expect(() =>
      mapGameDocumentToGameDetail(
        createPayloadGameDocument({
          cover: {
            alt: "Incomplete cover",
            createdAt: "2026-07-21T00:00:00.000Z",
            id: 42,
            updatedAt: "2026-07-21T00:00:00.000Z",
          },
        }),
      ),
    ).toThrow('Game "test-game" has no resolvable Media cover');
  });
});
