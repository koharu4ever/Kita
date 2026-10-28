import type { Metadata } from "next";
import { pageMetadata } from "@/config/metadata";
import { notFound } from "next/navigation";
import { cache } from "react";

import { GameDetailPage } from "@/features/games/components/game-detail-page";
import { getGameBySlug } from "@/server/games/get-games";

type GamePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

const getCachedGameBySlug = cache(getGameBySlug);

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getCachedGameBySlug(slug);

  if (!game) {
    return {
      title: "Game not found | Kita",
      robots: { index: false },
    };
  }

  return pageMetadata(
    `${game.title} | Kita`,
    game.summary,
    `/games/${encodeURIComponent(game.slug)}`,
    game.cover.src,
    "website",
  );
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await getCachedGameBySlug(slug);

  if (!game) {
    notFound();
  }

  return <GameDetailPage game={game} />;
}
