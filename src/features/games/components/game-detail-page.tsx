import Link from "next/link";

import type { GameItem } from "@/features/games/data/game-items";

type GameDetailPageProps = {
  game: GameItem;
};

const statusLabels: Record<GameItem["status"], string> = {
  finished: "Finished",
  playing: "Playing",
  planned: "Planned",
};

export function GameDetailPage({ game }: GameDetailPageProps) {
  return (
    <main className="min-h-screen bg-[#05070c] text-white">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-cover bg-center opacity-25 blur-sm"
        style={{ backgroundImage: `url('${game.cover.src}')` }}
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-gradient-to-b from-black/65 via-slate-950/88 to-black"
      />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <Link
          href={`/games?photo=${game.slug}`}
          className="mb-10 w-fit rounded-full bg-black/45 px-4 py-2 text-sm text-white/75 backdrop-blur transition hover:bg-white hover:text-black"
        >
          Back to image
        </Link>

        <article className="border-y border-white/15 py-8">
          <p className="text-xs tracking-[0.35em] text-white/45 uppercase">
            Game detail
          </p>
          <h1 className="mt-4 text-5xl leading-none font-semibold text-white">
            {game.title}
          </h1>
          {game.originalTitle ? (
            <p className="mt-2 text-lg text-white/55">{game.originalTitle}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/58">
            <span>{game.developer}</span>
            <span>{game.releaseDate}</span>
            <span>{statusLabels[game.status]}</span>
          </div>

          <p className="mt-8 text-lg leading-8 text-white/78">{game.summary}</p>

          <div className="mt-7 flex flex-wrap gap-2">
            {game.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="mt-8 border-l border-white/20 pl-4 text-sm leading-6 text-white/62">
            {game.note}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {game.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-white/72 underline underline-offset-4 transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
