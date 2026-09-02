import type { Metadata } from "next";
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
    };
  }

  return {
    title: `${review.title} | Kita`,
    description: review.excerpt,
  };
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
