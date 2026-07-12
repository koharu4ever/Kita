import type { PayloadGameDocument } from "@/features/games/utils/map-game-document-to-game-detail";
import type { Game } from "@/payload/payload-types";

export type SeedGame = PayloadGameDocument & Pick<Game, "publicationStatus">;

type SeedGameResult = Pick<Game, "id" | "slug" | "title">;

export type GameSeedClient = {
  create(options: {
    collection: "games";
    data: SeedGame;
  }): Promise<SeedGameResult>;
  find(options: {
    collection: "games";
    limit: 1;
    where: {
      slug: {
        equals: string;
      };
    };
  }): Promise<{
    docs: Array<Pick<Game, "id">>;
  }>;
  update(options: {
    collection: "games";
    data: SeedGame;
    id: Game["id"];
  }): Promise<SeedGameResult>;
};

export async function upsertGameSeeds(
  payload: GameSeedClient,
  gameSeeds: SeedGame[],
) {
  const createdOrUpdated: SeedGameResult[] = [];

  for (const game of gameSeeds) {
    const existing = await payload.find({
      collection: "games",
      limit: 1,
      where: {
        slug: {
          equals: game.slug,
        },
      },
    });

    const savedGame = existing.docs[0]
      ? await payload.update({
          collection: "games",
          id: existing.docs[0].id,
          data: game,
        })
      : await payload.create({
          collection: "games",
          data: game,
        });

    createdOrUpdated.push(savedGame);
  }

  return createdOrUpdated;
}
