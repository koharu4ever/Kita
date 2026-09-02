import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import type { ReviewPreview } from "@/features/reviews/types/review-preview";
import {
  formatReviewDate,
  formatReviewScore,
} from "@/features/reviews/utils/format-review-metadata";

import styles from "./reviews-experience.module.css";

type ReviewCardProps = {
  basePath?: "/reviews" | "/reviews/preview";
  review: ReviewPreview;
};

function getReviewHref(
  basePath: "/reviews" | "/reviews/preview",
  slug: string,
) {
  return `${basePath}/${slug}` as Route;
}

export function ReviewCard({ basePath = "/reviews", review }: ReviewCardProps) {
  const href = getReviewHref(basePath, review.slug);

  return (
    <article className={styles.card}>
      <div className={styles.cardMedia}>
        <Link
          href={href}
          aria-label={review.title}
          className="absolute inset-0"
        >
          <Image
            src={review.coverImage}
            alt={review.title}
            fill
            sizes="(min-width: 900px) 540px, 100vw"
            className={styles.cardImage}
          />
        </Link>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.meta}>
          <span>{review.gameTitle}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={review.date}>{formatReviewDate(review.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{formatReviewScore(review.rating)}</span>
        </div>

        <h2 className={styles.cardTitle}>
          <Link href={href}>{review.title}</Link>
        </h2>

        <p className={styles.excerpt}>{review.excerpt}</p>

        <div className={styles.tags}>
          {review.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
