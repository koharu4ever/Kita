import { Suspense } from "react";

import type { GameDetail } from "@/features/games/types/game-detail";

import { GameGalleryCard } from "./game-gallery-card";
import { GameLightbox } from "./game-lightbox";
import { GalleryHomeWindow } from "./gallery-home-window";

type GamesGalleryProps = {
  games: GameDetail[];
};

export function GamesGallery({ games }: GamesGalleryProps) {
  return (
    <>
      <h1 className="sr-only">Games</h1>
      <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
        <GalleryHomeWindow />

        {games.length > 0 ? (
          games.map((game, index) => (
            <GameGalleryCard key={game.slug} game={game} eager={index === 0} />
          ))
        ) : (
          <section className="mb-5 break-inside-avoid rounded-lg border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-black/35">
            <p className="text-xs tracking-[0.3em] text-sky-100/55 uppercase">
              Catalog status
            </p>
            <h2 className="mt-4 text-2xl font-semibold">
              No published games yet
            </h2>
            <p className="mt-3 leading-7 text-white/58">
              New catalog entries will appear here when published.
            </p>
          </section>
        )}
      </div>

      <Suspense fallback={null}>
        <GameLightbox games={games} />
      </Suspense>
    </>
  );
}
