import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { env } from "@/config/env";
import { ReviewsPage } from "@/features/reviews/components/reviews-page";
import { reviewPreviewFixtures } from "@/features/reviews/preview/review-preview-fixtures";
import {
  normalizeReviewPage,
  paginateReviews,
  reviewsPerPage,
} from "@/features/reviews/utils/review-pagination";

export const metadata: Metadata = {
  title: "Reviews UI Preview | Kita",
  robots: { follow: false, index: false },
};

type ReviewsPreviewPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function ReviewsPreviewPage({
  searchParams,
}: ReviewsPreviewPageProps) {
  if (env.NODE_ENV !== "development") {
    notFound();
  }

  const page = normalizeReviewPage((await searchParams).page);
  const result = paginateReviews(reviewPreviewFixtures, page, reviewsPerPage);

  if (page > result.pagination.totalPages) {
    notFound();
  }

  return (
    <ReviewsPage
      basePath="/reviews/preview"
      pagination={result.pagination}
      reviews={result.items}
    />
  );
}
