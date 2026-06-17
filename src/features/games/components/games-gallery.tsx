import { gameItems } from "@/features/games/data/game-items";

import { GameGalleryCard } from "./game-gallery-card";
import { GameLightbox } from "./game-lightbox";
import Link from "next/link";

export function GamesGallery() {
  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
        <Link
          href="/"
          aria-label="Return home"
          className="group relative mb-5 flex h-[560px] break-inside-avoid flex-col justify-end overflow-hidden rounded-lg border border-white/10 bg-white/10 px-6 pb-10 text-white shadow-2xl shadow-black/35"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center opacity-0 transition duration-500 group-hover:opacity-75"
            style={{ backgroundImage: "url('/home-rain-harbor.jpg')" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(125,211,252,0.18),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.12),rgba(2,6,23,0.96))] transition duration-500 group-hover:bg-[linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0.72))]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/70 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute inset-10 rounded-sm border border-white/8 bg-slate-950/35 shadow-[inset_0_0_80px_rgba(148,163,184,0.08)] transition duration-500 group-hover:border-sky-100/25 group-hover:bg-transparent group-hover:shadow-[inset_0_0_60px_rgba(186,230,253,0.18)]"
          />
          <span
            aria-hidden="true"
            className="absolute top-10 bottom-10 left-1/2 w-px bg-white/8 transition duration-500 group-hover:bg-sky-100/25"
          />
          <span
            aria-hidden="true"
            className="absolute top-1/2 right-10 left-10 h-px bg-white/8 transition duration-500 group-hover:bg-sky-100/25"
          />
          <div className="relative">
            <p className="mb-4 text-xs tracking-[0.35em] text-sky-100/70 uppercase">
              Visual Novel Shelf
            </p>
            <h1 className="kita-display text-7xl leading-none text-white">
              GAMES
            </h1>
            <p className="mt-5 max-w-[34ch] text-sm leading-6 text-white/72">
              Click a cover to open the image viewer. Details stay one small
              step deeper.
            </p>
            <p className="mt-8 text-xs tracking-[0.32em] text-white/35 uppercase transition group-hover:text-sky-100/70">
              Return Home
            </p>
          </div>
        </Link>

        {gameItems.map((game) => (
          <GameGalleryCard key={game.slug} game={game} />
        ))}
      </div>

      <GameLightbox games={gameItems} />
    </>
  );
}
