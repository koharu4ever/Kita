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

    return reviews.docs.map((review) =>
      mapReviewDocumentToReviewPreview(review),
    );
  } catch (error) {
    console.error("Failed to load reviews from Payload.", error);
    throw error;
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

    if (!review) return undefined;

    return mapReviewDocumentToReviewPreview(review);
  } catch (error) {
    console.error(`Failed to load review "${slug}" from Payload.`, error);
    throw error;
  }
}
