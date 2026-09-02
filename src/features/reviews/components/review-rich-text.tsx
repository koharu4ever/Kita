import { ContentRichText } from "@/features/content/components/content-rich-text";
import type { ReviewPreview } from "@/features/reviews/types/review-preview";
import { createReviewOutline } from "@/features/reviews/utils/review-outline";

import styles from "./review-rich-text.module.css";

export function ReviewRichText({ body }: Pick<ReviewPreview, "body">) {
  const { headingIds } = createReviewOutline(body);
  return (
    <ContentRichText
      className={styles.root}
      headingIds={headingIds}
      body={body}
    />
  );
}
