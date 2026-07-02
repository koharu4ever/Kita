import { RichText } from "@payloadcms/richtext-lexical/react";
import Image from "next/image";
import Link from "next/link";

import type { GameDetail } from "@/features/games/types/game-detail";

import styles from "./game-rich-text.module.css";

type GameDetailPageProps = {
  game: GameDetail;
};

const statusLabels: Record<GameDetail["status"], string> = {
  finished: "Finished",
  playing: "Playing",
  planned: "Planned",
};

export function GameDetailPage({ game }: GameDetailPageProps) {
  return (
    <main className="min-h-screen bg-[#050609] text-white">
      <section className="relative flex min-h-[72svh] items-center justify-center bg-black px-4 py-16 md:min-h-[82svh] md:px-10">
        <Link
          href={`/games?photo=${game.slug}`}
          className="absolute top-6 left-5 z-10 text-xs tracking-[0.22em] text-white/55 uppercase transition hover:text-white md:top-8 md:left-8"
        >
          &larr; Gallery
        </Link>

        <Image
          src={game.cover.src}
          alt={game.cover.alt}
          width={game.cover.width}
          height={game.cover.height}
          priority
          sizes="(max-width: 768px) 100vw, 92vw"
          className="max-h-[68svh] w-auto max-w-full object-contain md:max-h-[78svh]"
        />
      </section>

      <article className="mx-auto max-w-3xl px-6 py-14 md:py-20">
        <header className="border-b border-white/12 pb-9">
          <p className="text-xs tracking-[0.3em] text-white/42 uppercase">
            Game archive
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-semibold md:text-5xl">
            {game.title}
          </h1>
          {game.originalTitle ? (
            <p className="mt-2 text-base text-white/48">{game.originalTitle}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-x-3 gap-y-2 text-xs tracking-[0.14em] text-white/48 uppercase">
            <span>{game.developer}</span>
            <span aria-hidden="true">/</span>
            <span>{game.releaseDate}</span>
            <span aria-hidden="true">/</span>
            <span>{statusLabels[game.status]}</span>
          </div>
        </header>

        <div className="py-10">
          <p className="text-lg leading-8 text-white/76">{game.summary}</p>

          <RichText className={styles.root} data={game.body} />

          <p className="mt-8 text-xs tracking-[0.2em] text-white/38 uppercase">
            {game.tags.join(" / ")}
          </p>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/12 pt-7">
            {game.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-xs tracking-[0.18em] text-white/58 uppercase underline underline-offset-4 transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}
