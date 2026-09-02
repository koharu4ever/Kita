import { mapReviewDocumentToReviewPreview } from "@/features/reviews/utils/map-review-document-to-review-preview";
import type { ReviewPagination } from "@/features/reviews/utils/review-pagination";
import type { ReviewNavigation } from "@/features/reviews/types/review-preview";
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

export async function getReviewsPage(page: number, limit: number) {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "reviews",
      limit,
      overrideAccess: false,
      page,
      sort: "-publishedAt",
      where: {
        status: {
          equals: "published",
        },
      },
    });

    return {
      pagination: {
        currentPage: result.page ?? page,
        totalDocs: result.totalDocs,
        totalPages: Math.max(1, result.totalPages),
      } satisfies ReviewPagination,
      reviews: result.docs.map((review) =>
        mapReviewDocumentToReviewPreview(review),
      ),
    };
  } catch (error) {
    console.error("Failed to load paginated reviews from Payload.", error);
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

export async function getReviewNavigation(
  slug: string,
): Promise<ReviewNavigation> {
  const reviews = await getReviews();
  const index = reviews.findIndex((review) => review.slug === slug);

  if (index === -1) return {};

  const toNavigationItem = (review: (typeof reviews)[number] | undefined) =>
    review
      ? {
          date: review.date,
          slug: review.slug,
          title: review.title,
        }
      : undefined;

  return {
    next: toNavigationItem(reviews[index - 1]),
    previous: toNavigationItem(reviews[index + 1]),
  };
}

export async function getRandomReviewSlug(excludedSlug?: string) {
  const reviews = await getReviews();
  const candidates = excludedSlug
    ? reviews.filter((review) => review.slug !== excludedSlug)
    : reviews;

  if (candidates.length === 0) return undefined;

  return candidates[Math.floor(Math.random() * candidates.length)]?.slug;
}
