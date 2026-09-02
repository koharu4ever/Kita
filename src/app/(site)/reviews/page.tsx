import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReviewsPage as ReviewsFeaturePage } from "@/features/reviews/components/reviews-page";
import {
  normalizeReviewPage,
  reviewsPerPage,
} from "@/features/reviews/utils/review-pagination";
import { getReviewsPage } from "@/server/reviews/get-reviews";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reviews | Kita",
  description: "Read Kita's published long-form game reviews.",
};

type ReviewsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

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
