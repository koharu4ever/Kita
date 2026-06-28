import { env } from "@/config/env";
import {
  getReviewBySlug as getFallbackReviewBySlug,
  reviewItems,
} from "@/features/reviews/data/review-items";
import { mapReviewDocumentToReviewPreview } from "@/features/reviews/utils/map-review-document-to-review-preview";
import { getPayloadClient } from "@/server/payload/get-payload";

export async function getReviews() {
  try {
    const payload = await getPayloadClient();
    const reviews = await payload.find({
      collection: "reviews",
      limit: 20,
      overrideAccess: false,
      sort: "-publishedAt",
      where: {
        status: {
          equals: "published",
        },
      },
    });

    if (reviews.docs.length === 0) {
      return env.NODE_ENV === "production" ? [] : reviewItems;
    }

    return reviews.docs.map((review) =>
      mapReviewDocumentToReviewPreview(review),
    );
  } catch (error) {
    if (env.NODE_ENV === "production") {
      console.error("Failed to load reviews from Payload.", error);
      throw error;
    }

    console.warn(
      "Failed to load reviews from Payload. Using local fallback.",
      error,
    );

    return reviewItems;
  }
}

export async function getReviewBySlug(slug: string) {
  try {
    const payload = await getPayloadClient();
    const reviews = await payload.find({
      collection: "reviews",
      limit: 1,
      overrideAccess: false,
      where: {
        and: [
          {
            slug: {
              equals: slug,
            },
          },
          {
            status: {
              equals: "published",
            },
          },
        ],
      },
    });

    const review = reviews.docs[0];

    if (!review) {
      return env.NODE_ENV === "production"
        ? undefined
        : getFallbackReviewBySlug(slug);
    }

    return mapReviewDocumentToReviewPreview(review);
  } catch (error) {
    if (env.NODE_ENV === "production") {
      console.error(`Failed to load review "${slug}" from Payload.`, error);
      throw error;
    }

    console.warn(
      `Failed to load review "${slug}" from Payload. Using local fallback.`,
      error,
    );

    return getFallbackReviewBySlug(slug);
  }
}
