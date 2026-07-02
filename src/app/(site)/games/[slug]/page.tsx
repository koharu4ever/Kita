import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GameDetailPage } from "@/features/games/components/game-detail-page";
import { getGameBySlug } from "@/server/games/get-games";

type GamePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) {
    return {
      title: "Game not found",
    };
  }

  return {
    title: `${game.title} | Kita Games`,
    description: game.summary,
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  return <GameDetailPage game={game} />;
}
