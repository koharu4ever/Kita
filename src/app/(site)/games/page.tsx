import type { Metadata } from "next";

import { GamesPage as GamesFeaturePage } from "@/features/games/components/games-page";
import { getGames } from "@/server/games/get-games";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Games | Kita",
  description: "Browse Kita's published game catalog.",
};

export default async function GamesPage() {
  const games = await getGames();

  return <GamesFeaturePage games={games} />;
}
