export const reviewsPerPage = 4;

export type ReviewPagination = {
  currentPage: number;
  totalDocs: number;
  totalPages: number;
};

export type ReviewPaginationItem = number | "ellipsis";

export function normalizeReviewPage(
  value: string | string[] | undefined,
): number {
  const candidate = Array.isArray(value) ? value[0] : value;
  const page = Number(candidate);

  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function paginateReviews<T>(
  items: readonly T[],
  currentPage: number,
  pageSize = reviewsPerPage,
) {
  const totalDocs = items.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / pageSize));
  const start = (currentPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      currentPage,
      totalDocs,
      totalPages,
    } satisfies ReviewPagination,
  };
}

export function createReviewPaginationItems(
  currentPage: number,
  totalPages: number,
): ReviewPaginationItem[] {
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 2) {
    return [1, 2, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 1) {
    return [1, "ellipsis", totalPages - 1, totalPages];
  }

  return [1, "ellipsis", currentPage, "ellipsis", totalPages];
}
