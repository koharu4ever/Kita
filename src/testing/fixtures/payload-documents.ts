import type { PayloadGameDocument } from "@/features/games/utils/map-game-document-to-game-detail";
import type { PayloadReviewDocument } from "@/features/reviews/utils/map-review-document-to-review-preview";
import type { PayloadToolDocument } from "@/features/tools/utils/map-tool-document-to-toolkit-item";

const lexicalBody = {
  root: {
    children: [],
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
};

export function createPayloadToolDocument(
  overrides: Partial<PayloadToolDocument> = {},
): PayloadToolDocument {
  return {
    category: "database",
    createdAt: "2026-07-10T00:00:00.000Z",
    description: "A test tool description.",
    id: 101,
    title: "Test Tool",
    url: "https://example.com/tool",
    ...overrides,
  };
}

export function createPayloadReviewDocument(
  overrides: Partial<PayloadReviewDocument> = {},
): PayloadReviewDocument {
  return {
    body: lexicalBody as PayloadReviewDocument["body"],
    coverImage: "/reviews/test-cover.jpg",
    excerpt: "A test review excerpt.",
    gameTitle: "Test Game",
    publishedAt: "2026-07-10",
    rating: 8.5,
    readingTime: "6",
    slug: "test-review",
    tags: [{ id: "tag-1", label: "Drama" }],
    title: "Test Review",
    ...overrides,
  };
}

export function createPayloadGameDocument(
  overrides: Partial<PayloadGameDocument> = {},
): PayloadGameDocument {
  return {
    body: lexicalBody as PayloadGameDocument["body"],
    coverAlt: "Test game cover",
    coverHeight: 1200,
    coverSrc: "/games/covers/test-game.jpg",
    coverWidth: 1920,
    developer: "Test Studio",
    links: [
      { href: "https://example.com/game", id: "link-1", label: "Official" },
    ],
    originalTitle: "テストゲーム",
    playStatus: "playing",
    releaseDate: "2026-07-10",
    slug: "test-game",
    summary: "A test game summary.",
    tags: [{ id: "tag-1", label: "Drama" }],
    title: "Test Game",
    ...overrides,
  };
}
