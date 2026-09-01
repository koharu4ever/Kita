import type { Metadata } from "next";

import { ReviewsPage as ReviewsFeaturePage } from "@/features/reviews/components/reviews-page";
import { getReviews } from "@/server/reviews/get-reviews";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reviews | Kita",
  description: "Read Kita's published long-form game reviews.",
};

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return <ReviewsFeaturePage reviews={reviews} />;
}
