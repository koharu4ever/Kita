import type { GameDetail } from "@/features/games/types/game-detail";
import { mapGameDocumentToGameDetail } from "@/features/games/utils/map-game-document-to-game-detail";
import { getPayloadClient } from "@/server/payload/get-payload";

export async function getGames(): Promise<GameDetail[]> {
  try {
    const payload = await getPayloadClient();
    const games = await payload.find({
      collection: "games",
      depth: 1,
      limit: 100,
      overrideAccess: false,
      sort: "title",
      where: {
        publicationStatus: {
          equals: "published",
        },
      },
    });

    return games.docs.map(mapGameDocumentToGameDetail);
  } catch (error) {
    console.error("Failed to load games from Payload.", error);
    throw error;
  }
}

export async function getGameBySlug(
  slug: string,
): Promise<GameDetail | undefined> {
  try {
    const payload = await getPayloadClient();
    const games = await payload.find({
      collection: "games",
      depth: 1,
      limit: 1,
      overrideAccess: false,
      where: {
        and: [
          {
            slug: {
              equals: slug,
            },
          },
          {
            publicationStatus: {
              equals: "published",
            },
          },
        ],
      },
    });

    const game = games.docs[0];

    if (!game) return undefined;

    return mapGameDocumentToGameDetail(game);
  } catch (error) {
    console.error(`Failed to load game "${slug}" from Payload.`, error);
    throw error;
  }
}
