import type { ReviewPreview } from "@/features/reviews/types/review-preview";
import type { ReviewPagination } from "@/features/reviews/utils/review-pagination";

import { ReviewCard } from "./review-card";
import { ReviewsHero } from "./reviews-hero";
import { ReviewsPagination } from "./reviews-pagination";
import { ReviewsTopNav } from "./reviews-top-nav";
import styles from "./reviews-experience.module.css";

type ReviewsPageProps = {
  basePath?: "/reviews" | "/reviews/preview";
  pagination?: ReviewPagination;
  reviews: ReviewPreview[];
};

export function ReviewsPage({
  basePath = "/reviews",
  reviews,
  pagination = {
    currentPage: 1,
    totalDocs: reviews.length,
    totalPages: 1,
  },
}: ReviewsPageProps) {
  return (
    <main className={styles.page}>
      <ReviewsTopNav />
      <ReviewsHero />

      <section className={styles.content} id="reviews-feed">
        <div className={styles.feedIntro}>
          <p className={styles.feedEyebrow}>Latest writing</p>
          <p>
            游戏、叙事与体验的长篇记录。这里保留完整判断，也保留游玩之后仍值得回看的细节。
          </p>
        </div>

        {reviews.length > 0 ? (
          <>
            <div className={styles.feed}>
              {reviews.map((review) => (
                <ReviewCard
                  basePath={basePath}
                  key={review.slug}
                  review={review}
                />
              ))}
            </div>
            <ReviewsPagination basePath={basePath} {...pagination} />
          </>
        ) : (
          <section className={styles.emptyState}>
            <h2>还没有已发布的 Review</h2>
            <p>New long-form reviews will appear here when published.</p>
          </section>
        )}
      </section>
    </main>
  );
}
