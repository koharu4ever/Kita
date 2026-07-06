import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { createGameBody } from "@/features/games/data/game-items";
import type { PayloadGameDocument } from "@/features/games/utils/map-game-document-to-game-detail";
import type { Game } from "@/payload/payload-types";
import { getPayloadClient } from "@/server/payload/get-payload";

type SeedGame = PayloadGameDocument & Pick<Game, "publicationStatus">;

const seedGames: SeedGame[] = [
  {
    body: createGameBody([
      "The story begins with three separate sounds meeting at school: guitar, piano, and a voice from the rooftop. That brief harmony becomes the emotional center of a relationship shaped by late autumn, winter snow, and choices that arrive too late.",
      "This local entry is intentionally compact. It tests the real cover ratio and the new asset-path data flow without turning the game archive into a second review section.",
    ]),
    coverAlt: "WHITE ALBUM2 cover featuring two heroines in a snowy street",
    coverHeight: 1200,
    coverSrc: "/games/covers/white-album-2-v2.jpg",
    coverWidth: 1920,
    developer: "Leaf / AQUAPLUS / STING",
    links: [
      { href: "https://vndb.org/v7771", label: "VNDB" },
      {
        href: "https://en.wikipedia.org/wiki/White_Album_2",
        label: "Wikipedia",
      },
    ],
    originalTitle: "ホワイトアルバム2",
    playStatus: "planned",
    publicationStatus: "published",
    releaseDate: "2010-03-26",
    slug: "white-album-2",
    summary:
      "A long-form winter romance in which music, timing, and an earnest love triangle bind three people together before pulling them apart.",
    tags: [
      { label: "Romance" },
      { label: "Drama" },
      { label: "Winter" },
      { label: "Musical Themes" },
    ],
    title: "WHITE ALBUM2",
  },
];

export async function POST() {
  if (env.NODE_ENV === "production" || !env.ENABLE_DEV_SEED) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const payload = await getPayloadClient();
  const createdOrUpdated = [];

  for (const game of seedGames) {
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

  return NextResponse.json({
    count: createdOrUpdated.length,
    games: createdOrUpdated.map((game) => ({
      id: game.id,
      slug: game.slug,
      title: game.title,
    })),
  });
}
