import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import type {
  ReviewNavigation,
  ReviewPreview,
} from "@/features/reviews/types/review-preview";
import {
  formatReviewDate,
  formatReviewReadingTime,
  formatReviewScore,
} from "@/features/reviews/utils/format-review-metadata";
import { createReviewOutline } from "@/features/reviews/utils/review-outline";

import { ReviewComments } from "./review-comments";
import { ReviewReadingResume } from "./review-reading-resume";
import { ReviewRichText } from "./review-rich-text";
import { ReviewTableOfContents } from "./review-table-of-contents";
import styles from "./review-detail.module.css";
import shellStyles from "./reviews-experience.module.css";
import { ReviewsTopNav } from "./reviews-top-nav";

type ReviewDetailPageProps = {
  basePath?: "/reviews" | "/reviews/preview";
  navigation: ReviewNavigation;
  review: ReviewPreview;
};

function reviewHref(basePath: "/reviews" | "/reviews/preview", slug: string) {
  return `${basePath}/${slug}` as Route;
}

export function ReviewDetailPage({
  basePath = "/reviews",
  navigation,
  review,
}: ReviewDetailPageProps) {
  const { items: outline } = createReviewOutline(review.body);

  return (
    <main className={shellStyles.page}>
      <ReviewsTopNav />
      <ReviewReadingResume slug={review.slug} version={review.updatedAt} />

      <header className={styles.hero}>
        <Image
          alt=""
          className={styles.heroImage}
          fill
          priority
          sizes="100vw"
          src={review.coverImage}
        />
        <div className={styles.heroShade} />
        <div className={styles.heroContent}>
          <Link href={basePath} className={styles.backLink}>
            ← Review Journal
          </Link>
          <p className={shellStyles.eyebrow}>{review.gameTitle}</p>
          <h1>{review.title}</h1>
          <p className={styles.lead}>{review.excerpt}</p>
          <div className={`${shellStyles.meta} ${styles.heroMeta}`}>
            <time dateTime={review.date}>{formatReviewDate(review.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{formatReviewScore(review.rating)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatReviewReadingTime(review.readingTime)}</span>
          </div>
        </div>
      </header>

      <div className={styles.articleGrid}>
        <article className={styles.article}>
          <ReviewRichText body={review.body} />
          <div className={shellStyles.tags}>
            {review.tags.map((tag) => (
              <span className={shellStyles.tag} key={tag}>
                {tag}
              </span>
            ))}
          </div>

          <nav
            className={styles.articleNavigation}
            aria-label="Review navigation"
          >
            {navigation.previous ? (
              <Link href={reviewHref(basePath, navigation.previous.slug)}>
                <span>上一篇</span>
                {navigation.previous.title}
              </Link>
            ) : (
              <span />
            )}
            {navigation.next ? (
              <Link href={reviewHref(basePath, navigation.next.slug)}>
                <span>下一篇</span>
                {navigation.next.title}
              </Link>
            ) : null}
          </nav>
        </article>
        <ReviewTableOfContents items={outline} />
      </div>

      <ReviewComments />
    </main>
  );
}
