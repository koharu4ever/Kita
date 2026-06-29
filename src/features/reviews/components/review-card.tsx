import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import type { ReviewPreview } from "@/features/reviews/data/review-items";
import {
  formatReviewDate,
  formatReviewScore,
} from "@/features/reviews/utils/format-review-metadata";

type ReviewCardProps = {
  review: ReviewPreview;
  featured?: boolean;
};

function getReviewHref(slug: string) {
  return `/reviews/${slug}` as Route;
}

export function ReviewCard({ review, featured = false }: ReviewCardProps) {
  const href = getReviewHref(review.slug);

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 shadow-xl shadow-black/30 backdrop-blur-sm transition duration-300 hover:border-purple-200/25 hover:bg-slate-950/82">
      <div
        className={
          featured
            ? "relative aspect-video w-full"
            : "relative aspect-[16/10] w-full"
        }
      >
        <Link
          href={href}
          aria-label={review.title}
          className="absolute inset-0"
        >
          <Image
            src={review.coverImage}
            alt={review.title}
            fill
            sizes={
              featured
                ? "(min-width: 1152px) 1152px, 100vw"
                : "(min-width: 768px) 50vw, 100vw"
            }
            priority={featured}
            className="object-cover transition duration-500 hover:scale-[1.02]"
          />
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
      </div>

      <div className="space-y-4 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs tracking-wider text-purple-200/70 uppercase">
          <span>{review.gameTitle}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={review.date}>{formatReviewDate(review.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{formatReviewScore(review.rating)}</span>
        </div>

        <Link href={href}>
          <h2
            className={
              featured
                ? "text-3xl leading-tight font-semibold text-white transition hover:text-purple-100 md:text-4xl"
                : "text-2xl leading-tight font-semibold text-white transition hover:text-purple-100"
            }
          >
            {review.title}
          </h2>
        </Link>

        <p className="leading-relaxed text-slate-300">{review.excerpt}</p>

        <div className="flex flex-wrap gap-2">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-purple-300/20 bg-purple-300/10 px-2 py-1 text-xs text-purple-100"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
