import { env } from "@/config/env";
import {
  gameItems,
  getGameBySlug as getFallbackGameBySlug,
} from "@/features/games/data/game-items";
import type { GameDetail } from "@/features/games/types/game-detail";
import { mapGameDocumentToGameDetail } from "@/features/games/utils/map-game-document-to-game-detail";
import { getPayloadClient } from "@/server/payload/get-payload";

export async function getGames(): Promise<GameDetail[]> {
  try {
    const payload = await getPayloadClient();
    const games = await payload.find({
      collection: "games",
      limit: 100,
      overrideAccess: false,
      sort: "title",
      where: {
        publicationStatus: {
          equals: "published",
        },
      },
    });

    if (games.docs.length === 0) {
      return env.NODE_ENV === "production" ? [] : gameItems;
    }

    return games.docs.map(mapGameDocumentToGameDetail);
  } catch (error) {
    if (env.NODE_ENV === "production") {
      console.error("Failed to load games from Payload.", error);
      throw error;
    }

    console.warn(
      "Failed to load games from Payload. Using local fallback.",
      error,
    );
    return gameItems;
  }
}

export async function getGameBySlug(
  slug: string,
): Promise<GameDetail | undefined> {
  try {
    const payload = await getPayloadClient();
    const games = await payload.find({
      collection: "games",
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

    if (!game) {
      return env.NODE_ENV === "production"
        ? undefined
        : getFallbackGameBySlug(slug);
    }

    return mapGameDocumentToGameDetail(game);
  } catch (error) {
    if (env.NODE_ENV === "production") {
      console.error(`Failed to load game "${slug}" from Payload.`, error);
      throw error;
    }

    console.warn(
      `Failed to load game "${slug}" from Payload. Using local fallback.`,
      error,
    );

    return getFallbackGameBySlug(slug);
  }
}
