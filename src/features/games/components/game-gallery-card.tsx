import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import type { GameItem } from "@/features/games/data/game-items";

type GameGalleryCardProps = {
  game: GameItem;
};

export function GameGalleryCard({ game }: GameGalleryCardProps) {
  const href = `/games?photo=${game.slug}` as Route;

  return (
    <Link
      href={href}
      scroll={false}
      title={game.title}
      className="group relative mb-5 block w-full cursor-zoom-in break-inside-avoid overflow-hidden rounded-lg bg-white/10 shadow-2xl shadow-black/35 outline outline-1 outline-offset-[-1px] outline-white/10 transition hover:outline-white/35"
    >
      <Image
        src={game.cover.src}
        alt={game.cover.alt}
        width={game.cover.width}
        height={game.cover.height}
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 25vw"
        className="h-auto w-full transform brightness-90 transition duration-300 will-change-auto group-hover:scale-[1.015] group-hover:brightness-110"
      />
    </Link>
  );
}
