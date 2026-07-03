import type { DefaultTypedEditorState } from "@payloadcms/richtext-lexical";

import type { GameDetail } from "@/features/games/types/game-detail";
import type { Game } from "@/payload/payload-types";

export type PayloadGameDocument = Pick<
  Game,
  | "body"
  | "coverAlt"
  | "coverHeight"
  | "coverSrc"
  | "coverWidth"
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
    cover: {
      src: game.coverSrc,
      alt: game.coverAlt,
      width: game.coverWidth,
      height: game.coverHeight,
    },
    tags: game.tags?.map((tag) => tag.label) ?? [],
    links:
      game.links?.map((link) => ({
        href: link.href,
        label: link.label,
      })) ?? [],
  };
}
