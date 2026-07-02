import { GamesPage as GamesFeaturePage } from "@/features/games/components/games-page";
import { getGames } from "@/server/games/get-games";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const games = await getGames();

  return <GamesFeaturePage games={games} />;
}
