import type { Route } from "next";
import Link from "next/link";

import type { ReviewPagination } from "@/features/reviews/utils/review-pagination";
import { createReviewPaginationItems } from "@/features/reviews/utils/review-pagination";

import styles from "./reviews-experience.module.css";

type ReviewsPaginationProps = ReviewPagination & {
  basePath: "/reviews" | "/reviews/preview";
};

function getPageHref(
  basePath: ReviewsPaginationProps["basePath"],
  page: number,
) {
  const query = page === 1 ? "" : `?page=${page}`;
  return `${basePath}${query}#reviews-feed` as Route;
}

export function ReviewsPagination({
  basePath,
  currentPage,
  totalPages,
}: ReviewsPaginationProps) {
  if (totalPages <= 1) return null;

  const items = createReviewPaginationItems(currentPage, totalPages);

  return (
    <nav className={styles.pagination} aria-label="Review 分页">
      {currentPage > 1 ? (
        <Link
          href={getPageHref(basePath, currentPage - 1)}
          className={styles.paginationArrow}
          aria-label="上一页"
        >
          ←
        </Link>
      ) : null}

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            className={styles.paginationEllipsis}
            aria-hidden="true"
            key={`ellipsis-${index}`}
          >
            …
          </span>
        ) : item === currentPage ? (
          <span
            className={styles.paginationCurrent}
            aria-current="page"
            key={item}
          >
            {item}
          </span>
        ) : (
          <Link
            href={getPageHref(basePath, item)}
            className={styles.paginationLink}
            aria-label={`第 ${item} 页`}
            key={item}
          >
            {item}
          </Link>
        ),
      )}

      {currentPage < totalPages ? (
        <Link
          href={getPageHref(basePath, currentPage + 1)}
          className={styles.paginationArrow}
          aria-label="下一页"
        >
          →
        </Link>
      ) : null}
    </nav>
  );
}
