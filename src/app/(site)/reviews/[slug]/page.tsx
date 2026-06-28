import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReviewDetailPage } from "@/features/reviews/components/review-detail-page";
import { getReviewBySlug } from "@/server/reviews/get-reviews";

type ReviewPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ReviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);

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
  const review = await getReviewBySlug(slug);

  if (!review) {
    notFound();
  }

  return <ReviewDetailPage review={review} />;
}
