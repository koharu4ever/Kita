import { describe, expect, it } from "vitest";

import { mapReviewDocumentToReviewPreview } from "@/features/reviews/utils/map-review-document-to-review-preview";
import { createPayloadReviewDocument } from "@/testing/fixtures/payload-documents";

describe("mapReviewDocumentToReviewPreview", () => {
  it("maps review fields and compacts tag labels", () => {
    const result = mapReviewDocumentToReviewPreview(
      createPayloadReviewDocument({
        tags: [
          { id: "tag-1", label: "Drama" },
          { id: "tag-2", label: "" },
          { id: "tag-3", label: "Winter" },
        ],
      }),
    );

    expect(result).toMatchObject({
      gameTitle: "Test Game",
      rating: 8.5,
      slug: "test-review",
      tags: ["Drama", "Winter"],
      title: "Test Review",
    });
  });

  it("maps nullable tags to an empty array", () => {
    const result = mapReviewDocumentToReviewPreview(
      createPayloadReviewDocument({ tags: null }),
    );

    expect(result.tags).toEqual([]);
  });
});
