import { ReviewsPage as ReviewsFeaturePage } from "@/features/reviews/components/reviews-page";
import { getReviews } from "@/server/reviews/get-reviews";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return <ReviewsFeaturePage reviews={reviews} />;
}
