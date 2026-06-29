import { RichText } from "@payloadcms/richtext-lexical/react";
import Link from "next/link";

import type { ReviewPreview } from "@/features/reviews/data/review-items";
import {
  formatReviewDate,
  formatReviewReadingTime,
  formatReviewScore,
} from "@/features/reviews/utils/format-review-metadata";

import { ReviewsTopNav } from "./reviews-top-nav";
import styles from "./review-rich-text.module.css";

type ReviewDetailPageProps = {
  review: ReviewPreview;
};

export function ReviewDetailPage({ review }: ReviewDetailPageProps) {
  return (
    <main className="min-h-screen bg-[#06060b] text-white">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-cover bg-center opacity-20 blur-sm"
        style={{ backgroundImage: `url('${review.coverImage}')` }}
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-gradient-to-b from-black/68 via-[#090816]/88 to-black"
      />

      <ReviewsTopNav />

      <article className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-28">
        <Link
          href="/reviews"
          className="mb-10 w-fit text-xs tracking-[0.24em] text-white/45 uppercase transition hover:text-white"
        >
          Back to reviews
        </Link>

        <div className="border-y border-white/12 py-9">
          <p className="text-xs tracking-[0.34em] text-purple-100/45 uppercase">
            {review.gameTitle}
          </p>
          <h1 className="mt-5 text-4xl leading-tight font-semibold text-white md:text-5xl">
            {review.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-white/48">
            <time dateTime={review.date}>{formatReviewDate(review.date)}</time>
            <span aria-hidden="true">·</span>
            <span>{formatReviewScore(review.rating)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatReviewReadingTime(review.readingTime)}</span>
          </div>

          <p className="mt-8 text-lg leading-8 text-white/72">
            {review.excerpt}
          </p>

          <RichText className={styles.root} data={review.body} />

          <div className="mt-8 flex flex-wrap gap-2">
            {review.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs text-white/58"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}
