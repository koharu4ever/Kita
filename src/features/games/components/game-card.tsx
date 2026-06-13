import Image from "next/image";

import type { GamePreview } from "@/features/games/data/game-items";

type GameCardProps = {
  game: GamePreview;
};

export function GameCard({ game }: GameCardProps) {
  return (
    <article className="group overflow-hidden rounded-lg border border-sky-200/15 bg-sky-950/45 shadow-xl shadow-black/30 backdrop-blur-md transition-colors hover:border-sky-200/35">
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Image
          src={game.coverImage}
          alt={game.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
        <span className="absolute top-3 left-3 rounded-md border border-white/15 bg-black/45 px-2 py-1 text-xs tracking-wider text-sky-100 uppercase">
          {game.status}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <h2 className="text-xl leading-tight font-semibold text-white">
          {game.title}
        </h2>
        <p className="text-sm text-slate-300">
          {game.developer} / {game.releaseDate}
        </p>
        <div className="flex flex-wrap gap-2">
          {game.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-sky-200/15 bg-sky-200/10 px-2 py-1 text-xs text-sky-100"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
