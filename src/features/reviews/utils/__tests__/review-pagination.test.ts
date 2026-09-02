import { describe, expect, it } from "vitest";

import {
  createReviewPaginationItems,
  normalizeReviewPage,
  paginateReviews,
} from "../review-pagination";

describe("review pagination", () => {
  it("normalizes invalid query values to the first page", () => {
    expect(normalizeReviewPage(undefined)).toBe(1);
    expect(normalizeReviewPage("not-a-number")).toBe(1);
    expect(normalizeReviewPage("0")).toBe(1);
    expect(normalizeReviewPage(["3", "4"])).toBe(3);
  });

  it("slices preview items and keeps pagination metadata", () => {
    expect(paginateReviews([1, 2, 3, 4, 5, 6], 2, 4)).toEqual({
      items: [5, 6],
      pagination: {
        currentPage: 2,
        totalDocs: 6,
        totalPages: 2,
      },
    });
  });

  it("uses the same compact first, nearby and last-page pattern as the blog", () => {
    expect(createReviewPaginationItems(1, 5)).toEqual([1, 2, "ellipsis", 5]);
    expect(createReviewPaginationItems(3, 7)).toEqual([
      1,
      "ellipsis",
      3,
      "ellipsis",
      7,
    ]);
    expect(createReviewPaginationItems(7, 7)).toEqual([1, "ellipsis", 6, 7]);
  });
});
