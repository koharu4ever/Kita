import type { Metadata } from "next";
import { pageMetadata } from "@/config/metadata";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ReviewDetailPage } from "@/features/reviews/components/review-detail-page";
import {
  getReviewBySlug,
  getReviewNavigation,
} from "@/server/reviews/get-reviews";

type ReviewPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

const getCachedReviewBySlug = cache(getReviewBySlug);

export async function generateMetadata({
  params,
}: ReviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const review = await getCachedReviewBySlug(slug);

  if (!review) {
    return {
      title: "Review not found | Kita",
      robots: { index: false },
    };
  }

  return pageMetadata(
    `${review.title} | Kita`,
    review.excerpt,
    `/reviews/${encodeURIComponent(review.slug)}`,
    review.coverImage,
    "article",
  );
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { slug } = await params;
  const review = await getCachedReviewBySlug(slug);

  if (!review) {
    notFound();
  }

  const navigation = await getReviewNavigation(review.slug);

  return <ReviewDetailPage navigation={navigation} review={review} />;
}
