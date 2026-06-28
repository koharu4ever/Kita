import type { DefaultTypedEditorState } from "@payloadcms/richtext-lexical";

import type { Review } from "@/payload/payload-types";
import type { ReviewPreview } from "@/features/reviews/data/review-items";

export type PayloadReviewDocument = Pick<
  Review,
  | "body"
  | "coverImage"
  | "excerpt"
  | "gameTitle"
  | "publishedAt"
  | "rating"
  | "readingTime"
  | "slug"
  | "tags"
  | "title"
>;

function compactStrings(values: Array<string | null | undefined> = []) {
  return values.filter((value): value is string => Boolean(value));
}

export function mapReviewDocumentToReviewPreview(
  review: PayloadReviewDocument,
): ReviewPreview {
  return {
    slug: review.slug,
    title: review.title,
    gameTitle: review.gameTitle,
    date: review.publishedAt,
    excerpt: review.excerpt,
    coverImage: review.coverImage,
    rating: review.rating,
    readingTime: review.readingTime,
    tags: compactStrings(review.tags?.map((tag) => tag.label) ?? []),
    body: review.body as DefaultTypedEditorState,
  };
}
