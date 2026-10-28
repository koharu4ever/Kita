import { pageMetadata } from "@/config/metadata";

import { GamesPage as GamesFeaturePage } from "@/features/games/components/games-page";
import { getGames } from "@/server/games/get-games";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata(
  "Games | Kita",
  "Browse Kita's personal collection of games and visual novels, with game information and impressions.",
  "/games",
);

export default async function GamesPage() {
  const games = await getGames();

  return <GamesFeaturePage games={games} />;
}
