import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { env } from "@/config/env";
import { ReviewDetailPage } from "@/features/reviews/components/review-detail-page";
import {
  getReviewPreviewFixture,
  getReviewPreviewNavigation,
} from "@/features/reviews/preview/review-preview-fixtures";

type ReviewPreviewPageProps = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Review UI Preview | Kita",
  robots: { follow: false, index: false },
};

export default async function ReviewPreviewPage({
  params,
}: ReviewPreviewPageProps) {
  if (env.NODE_ENV !== "development") {
    notFound();
  }

  const { slug } = await params;
  const review = getReviewPreviewFixture(slug);

  if (!review) {
    notFound();
  }

  return (
    <ReviewDetailPage
      basePath="/reviews/preview"
      navigation={getReviewPreviewNavigation(slug)}
      review={review}
    />
  );
}
