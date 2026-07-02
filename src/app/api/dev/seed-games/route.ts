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
      "A single compact paragraph is enough for entries that only need identification and a brief personal note.",
    ]),
    coverKey: "sea-side-fragment",
    developer: "Kita Sample Works",
    links: [{ href: "https://vndb.org/", label: "VNDB" }],
    originalTitle: "Short Signal",
    playStatus: "finished",
    publicationStatus: "published",
    releaseDate: "2024",
    slug: "short-signal",
    summary:
      "A compact archive entry used to test the smallest useful game detail page.",
    tags: [{ label: "Short" }, { label: "Archive" }],
    title: "Short Signal",
  },
  {
    body: createGameBody([
      "This sample keeps the body moderate while placing most of the pressure on the title and metadata area.",
      "It checks that the heading wraps naturally on smaller screens without changing the width of the reading column.",
    ]),
    coverKey: "night-archive",
    developer: "Last Platform Studio",
    links: [{ href: "https://vndb.org/", label: "VNDB" }],
    originalTitle: "終電が港を離れる前の、いちばん長い夜",
    playStatus: "playing",
    publicationStatus: "published",
    releaseDate: "2025",
    slug: "long-title-night",
    summary:
      "A long-title sample about a harbor platform, a delayed final train, and a conversation that refuses to end.",
    tags: [{ label: "Long Title" }, { label: "Night" }],
    title: "The Longest Night Before the Last Train Leaves the Harbor",
  },
  {
    body: createGameBody([
      "The rain begins before the first scene and remains after the final line. This opening paragraph tests the ordinary reading rhythm of a game archive entry.",
      "A second paragraph can record the premise, edition, route, or translation used without forcing those details into permanent database columns.",
      "Longer entries can continue with personal observations. The archive does not need to become a scored review: it only needs enough room to explain why the game deserves a place on the shelf.",
      "Because this content is Rich Text, the Admin editor can later add headings, emphasis, lists, quotations, and links while the front-end contract remains unchanged.",
      "The final paragraph checks the lower-page spacing before tags and external references. It also demonstrates that a substantial entry still belongs inside the same restrained layout.",
    ]),
    coverKey: "after-rain",
    developer: "Rain Window",
    links: [
      { href: "https://vndb.org/", label: "VNDB" },
      { href: "https://example.com/", label: "Official Site Sample" },
    ],
    originalTitle: "雨の記録",
    playStatus: "planned",
    publicationStatus: "published",
    releaseDate: "2026",
    slug: "long-body-rain-archive",
    summary:
      "A long-form sample used to judge whether flexible editorial content still feels like a game archive rather than a review page.",
    tags: [{ label: "Long Body" }, { label: "Rain" }, { label: "Memory" }],
    title: "Rain Archive",
  },
];

export async function POST() {
  if (env.NODE_ENV === "production" || !env.ENABLE_DEV_SEED) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const payload = await getPayloadClient();
  const existingGames = await payload.find({
    collection: "games",
    limit: 100,
  });

  for (const game of existingGames.docs) {
    await payload.delete({
      collection: "games",
      id: game.id,
    });
  }

  const createdGames = [];

  for (const game of seedGames) {
    createdGames.push(
      await payload.create({
        collection: "games",
        data: game,
      }),
    );
  }

  return NextResponse.json({
    count: createdGames.length,
    games: createdGames.map((game) => ({
      id: game.id,
      slug: game.slug,
      title: game.title,
    })),
  });
}
