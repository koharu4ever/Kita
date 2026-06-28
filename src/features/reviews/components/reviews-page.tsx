import type { ReviewPreview } from "@/features/reviews/data/review-items";

import { ReviewCard } from "./review-card";
import { ReviewsTopNav } from "./reviews-top-nav";

type ReviewsPageProps = {
  reviews: ReviewPreview[];
};

export function ReviewsPage({ reviews }: ReviewsPageProps) {
  const [featuredReview, ...moreReviews] = reviews;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/home-night-sky.jpg')" }}
      />
      <div className="fixed inset-0 bg-slate-950/65" />

      <ReviewsTopNav />

      <section className="relative z-10 mx-auto max-w-6xl px-5 pt-24 pb-16 md:pt-28 md:pb-20">
        <header className="mb-10 text-center">
          <p className="mb-3 text-sm tracking-[0.35em] text-purple-200/70 uppercase">
            Kita Archive
          </p>
          <h1 className="kita-display text-6xl leading-none text-white md:text-7xl">
            REVIEWS
          </h1>
        </header>

        {featuredReview ? (
          <ReviewCard review={featuredReview} featured />
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {moreReviews.map((review) => (
            <ReviewCard key={review.slug} review={review} />
          ))}
        </div>
      </section>
    </main>
  );
}
