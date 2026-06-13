import { gameItems } from "@/features/games/data/game-items";

import { GameCard } from "./game-card";

export function GamesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-cover bg-center opacity-35"
        style={{ backgroundImage: "url('/home-sea-girl.jpg')" }}
      />
      <div className="fixed inset-0 bg-slate-950/70" />

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-16 md:py-20">
        <header className="mb-10 text-center">
          <p className="mb-3 text-sm tracking-[0.35em] text-sky-200/70 uppercase">
            Visual Novel Shelf
          </p>
          <h1 className="kita-display text-6xl leading-none text-white md:text-7xl">
            GAMES
          </h1>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {gameItems.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>
    </main>
  );
}
