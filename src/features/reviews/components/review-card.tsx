import Image from "next/image";

import type { ReviewPreview } from "@/features/reviews/data/review-items";

type ReviewCardProps = {
  review: ReviewPreview;
  featured?: boolean;
};

export function ReviewCard({ review, featured = false }: ReviewCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 shadow-xl shadow-black/30 backdrop-blur-sm">
      <div
        className={
          featured
            ? "relative aspect-video w-full"
            : "relative aspect-[16/10] w-full"
        }
      >
        <Image
          src={review.coverImage}
          alt={review.title}
          fill
          sizes={featured ? "100vw" : "(min-width: 768px) 50vw, 100vw"}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
      </div>

      <div className="space-y-4 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs tracking-wider text-purple-200/70 uppercase">
          <span>{review.gameTitle}</span>
          <span>/</span>
          <time dateTime={review.date}>{review.date}</time>
          <span>/</span>
          <span>{review.rating.toFixed(1)}</span>
        </div>

        <h2
          className={
            featured
              ? "text-3xl leading-tight font-semibold text-white md:text-4xl"
              : "text-2xl leading-tight font-semibold text-white"
          }
        >
          {review.title}
        </h2>

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
