import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPayloadClientMock, mockEnv } = vi.hoisted(() => ({
  getPayloadClientMock: vi.fn(),
  mockEnv: {
    NODE_ENV: "development" as "development" | "production" | "test",
  },
}));

vi.mock("@/config/env", () => ({ env: mockEnv }));
vi.mock("@/server/payload/get-payload", () => ({
  getPayloadClient: getPayloadClientMock,
}));

import { getReviewBySlug, getReviews } from "@/server/reviews/get-reviews";
import {
  getReviewBySlug as getFallbackReviewBySlug,
  reviewItems,
} from "@/features/reviews/data/review-items";
import { createPayloadReviewDocument } from "@/testing/fixtures/payload-documents";

function arrangeFind(docs: unknown[]) {
  const find = vi.fn().mockResolvedValue({ docs });
  getPayloadClientMock.mockResolvedValue({ find });
  return find;
}

describe("getReviews", () => {
  beforeEach(() => {
    getPayloadClientMock.mockReset();
    mockEnv.NODE_ENV = "development";
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
        where: { status: { equals: "published" } },
      }),
    );
  });

  it("uses local fallback when development data is empty", async () => {
    arrangeFind([]);

    await expect(getReviews()).resolves.toBe(reviewItems);
  });

  it("returns a real empty result when production data is empty", async () => {
    mockEnv.NODE_ENV = "production";
    arrangeFind([]);

    await expect(getReviews()).resolves.toEqual([]);
  });

  it("uses local fallback when development Payload throws", async () => {
    const error = new Error("Payload unavailable");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    getPayloadClientMock.mockRejectedValue(error);

    await expect(getReviews()).resolves.toBe(reviewItems);
  });

  it("rethrows production Payload errors", async () => {
    const error = new Error("Payload unavailable");
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockEnv.NODE_ENV = "production";
    getPayloadClientMock.mockRejectedValue(error);

    await expect(getReviews()).rejects.toBe(error);
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

  it("uses the matching development fallback when a slug is missing", async () => {
    arrangeFind([]);

    await expect(getReviewBySlug("quiet-after-rain")).resolves.toBe(
      getFallbackReviewBySlug("quiet-after-rain"),
    );
  });

  it("returns undefined for a missing production slug", async () => {
    mockEnv.NODE_ENV = "production";
    arrangeFind([]);

    await expect(getReviewBySlug("missing-review")).resolves.toBeUndefined();
  });
});
