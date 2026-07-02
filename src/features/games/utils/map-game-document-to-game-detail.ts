import type { DefaultTypedEditorState } from "@payloadcms/richtext-lexical";

import { resolveGameCover } from "@/features/games/data/game-cover-assets";
import type { GameDetail } from "@/features/games/types/game-detail";
import type { Game } from "@/payload/payload-types";

export type PayloadGameDocument = Pick<
  Game,
  | "body"
  | "coverKey"
  | "developer"
  | "links"
  | "originalTitle"
  | "playStatus"
  | "releaseDate"
  | "slug"
  | "summary"
  | "tags"
  | "title"
>;

export function mapGameDocumentToGameDetail(
  game: PayloadGameDocument,
): GameDetail {
  return {
    slug: game.slug,
    title: game.title,
    originalTitle: game.originalTitle ?? undefined,
    developer: game.developer,
    releaseDate: game.releaseDate,
    status: game.playStatus,
    summary: game.summary,
    body: game.body as DefaultTypedEditorState,
    cover: resolveGameCover(game.coverKey),
    tags: game.tags?.map((tag) => tag.label) ?? [],
    links:
      game.links?.map((link) => ({
        href: link.href,
        label: link.label,
      })) ?? [],
  };
}
