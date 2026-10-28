import { pageMetadata } from "@/config/metadata";
import { notFound } from "next/navigation";

import { ReviewsPage as ReviewsFeaturePage } from "@/features/reviews/components/reviews-page";
import {
  normalizeReviewPage,
  reviewsPerPage,
} from "@/features/reviews/utils/review-pagination";
import { getReviewsPage } from "@/server/reviews/get-reviews";

export const dynamic = "force-dynamic";

type ReviewsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({ searchParams }: ReviewsPageProps) {
  const page = normalizeReviewPage((await searchParams).page);
  return pageMetadata(
    page > 1 ? `Reviews — Page ${page} | Kita` : "Reviews | Kita",
    "Personal reviews and reflections on games and visual novels from Kita.",
    page > 1 ? `/reviews?page=${page}` : "/reviews",
  );
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const page = normalizeReviewPage((await searchParams).page);
  const result = await getReviewsPage(page, reviewsPerPage);

  if (page > result.pagination.totalPages) {
    notFound();
  }

  return (
    <ReviewsFeaturePage
      pagination={result.pagination}
      reviews={result.reviews}
    />
  );
}
