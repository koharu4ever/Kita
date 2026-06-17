import { notFound } from "next/navigation";

import { GameDetailPage } from "@/features/games/components/game-detail-page";
import { gameItems, getGameBySlug } from "@/features/games/data/game-items";

type GamePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return gameItems.map((game) => ({
    slug: game.slug,
  }));
}

export async function generateMetadata({ params }: GamePageProps) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

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
  const game = getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  return <GameDetailPage game={game} />;
}
