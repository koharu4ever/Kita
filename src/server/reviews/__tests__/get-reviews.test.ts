import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getPayloadClientMock } = vi.hoisted(() => ({
  getPayloadClientMock: vi.fn(),
}));
vi.mock("@/server/payload/get-payload", () => ({
  getPayloadClient: getPayloadClientMock,
}));

import {
  getRandomReviewSlug,
  getReviewBySlug,
  getReviewNavigation,
  getReviews,
  getReviewsPage,
} from "@/server/reviews/get-reviews";
import { createPayloadReviewDocument } from "@/testing/fixtures/payload-documents";

function arrangeFind(docs: unknown[]) {
  const find = vi.fn().mockResolvedValue({ docs });
  getPayloadClientMock.mockResolvedValue({ find });
  return find;
}

describe("getReviews", () => {
  beforeEach(() => {
    getPayloadClientMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns mapped published reviews", async () => {
    const find = arrangeFind([
      createPayloadReviewDocument({ title: "Payload Review" }),
    ]);

    const result = await getReviews();

    expect(result[0]).toMatchObject({
      slug: "test-review",
      title: "Payload Review",
    });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "reviews",
        overrideAccess: false,
        pagination: false,
        where: { status: { equals: "published" } },
      }),
    );
  });

  it("returns an empty collection when Payload has no published reviews", async () => {
    arrangeFind([]);

    await expect(getReviews()).resolves.toEqual([]);
  });

  it("returns Payload pagination metadata with mapped reviews", async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [createPayloadReviewDocument({ title: "Second page" })],
      page: 2,
      totalDocs: 9,
      totalPages: 3,
    });
    getPayloadClientMock.mockResolvedValue({ find });

    await expect(getReviewsPage(2, 4)).resolves.toMatchObject({
      pagination: {
        currentPage: 2,
        totalDocs: 9,
        totalPages: 3,
      },
      reviews: [{ title: "Second page" }],
    });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 4,
        page: 2,
      }),
    );
  });

  it("rethrows Payload errors so the route error boundary can respond", async () => {
    const error = new Error("Payload unavailable");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    getPayloadClientMock.mockRejectedValue(error);

    await expect(getReviews()).rejects.toBe(error);
    expect(log).toHaveBeenCalledWith(
      "Failed to load reviews from Payload.",
      error,
    );
  });

  it("returns a mapped review by slug", async () => {
    const find = arrangeFind([
      createPayloadReviewDocument({ slug: "payload-review" }),
    ]);

    const result = await getReviewBySlug("payload-review");

    expect(result?.slug).toBe("payload-review");
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        overrideAccess: false,
        where: {
          and: [
            { slug: { equals: "payload-review" } },
            { status: { equals: "published" } },
          ],
        },
      }),
    );
  });

  it("returns undefined for a missing slug", async () => {
    arrangeFind([]);

    await expect(getReviewBySlug("missing-review")).resolves.toBeUndefined();
  });

  it("rethrows detail query errors so the route error boundary can respond", async () => {
    const error = new Error("Payload unavailable");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    getPayloadClientMock.mockRejectedValue(error);

    await expect(getReviewBySlug("test-review")).rejects.toBe(error);
    expect(log).toHaveBeenCalledWith(
      'Failed to load review "test-review" from Payload.',
      error,
    );
  });

  it("builds previous and next navigation from publication order", async () => {
    arrangeFind([
      createPayloadReviewDocument({ slug: "new", title: "New" }),
      createPayloadReviewDocument({ slug: "current", title: "Current" }),
      createPayloadReviewDocument({ slug: "old", title: "Old" }),
    ]);

    await expect(getReviewNavigation("current")).resolves.toMatchObject({
      next: { slug: "new" },
      previous: { slug: "old" },
    });
  });

  it("keeps navigation available beyond the first twenty reviews", async () => {
    const find = arrangeFind(
      Array.from({ length: 22 }, (_, index) =>
        createPayloadReviewDocument({ slug: `review-${index}` }),
      ),
    );

    await expect(getReviewNavigation("review-20")).resolves.toMatchObject({
      next: { slug: "review-19" },
      previous: { slug: "review-21" },
    });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: false,
        overrideAccess: false,
        where: { status: { equals: "published" } },
      }),
    );
  });

  it("excludes the current review when choosing a random review", async () => {
    arrangeFind([
      createPayloadReviewDocument({ slug: "current" }),
      createPayloadReviewDocument({ slug: "other" }),
    ]);

    await expect(getRandomReviewSlug("current")).resolves.toBe("other");
  });
});
