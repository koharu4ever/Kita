import path from "node:path";

import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { createGameBody } from "@/features/games/data/game-items";
import { getPayloadClient } from "@/server/payload/get-payload";
import { upsertGameSeeds, type SeedGame } from "@/server/games/seed-games";

const gameSeedTemplates: Array<Omit<SeedGame, "cover">> = [
  {
    body: createGameBody([
      "The story begins with three separate sounds meeting at school: guitar, piano, and a voice from the rooftop. That brief harmony becomes the emotional center of a relationship shaped by late autumn, winter snow, and choices that arrive too late.",
      "This local entry is intentionally compact. It tests the real cover ratio and the new asset-path data flow without turning the game archive into a second review section.",
    ]),
    developer: "Leaf / AQUAPLUS / STING",
    links: [
      {
        href: "https://archive.kral-koharu.com/White%20Album%202.zip",
        label: "Game archive",
      },
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
  const existingCover = await payload.find({
    collection: "media",
    limit: 1,
    where: {
      filename: {
        equals: "white-album-2-v2.jpg",
      },
    },
  });
  const cover =
    existingCover.docs[0] ??
    (await payload.create({
      collection: "media",
      data: {
        alt: "WHITE ALBUM2 cover featuring two heroines in a snowy street",
      },
      filePath: path.resolve(
        process.cwd(),
        "public/games/covers/white-album-2-v2.jpg",
      ),
    }));
  const gameSeeds: SeedGame[] = gameSeedTemplates.map((game) => ({
    ...game,
    cover: cover.id,
  }));
  const createdOrUpdated = await upsertGameSeeds(payload, gameSeeds);

  return NextResponse.json({
    count: createdOrUpdated.length,
    games: createdOrUpdated.map((game) => ({
      id: game.id,
      slug: game.slug,
      title: game.title,
    })),
  });
}
