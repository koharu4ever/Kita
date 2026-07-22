import type { DefaultTypedEditorState } from "@payloadcms/richtext-lexical";

import type { GameDetail } from "@/features/games/types/game-detail";
import type { Game } from "@/payload/payload-types";

export type PayloadGameDocument = Pick<
  Game,
  | "body"
  | "cover"
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

function resolvePayloadMediaCover(
  cover: PayloadGameDocument["cover"],
): GameDetail["cover"] | undefined {
  if (!cover || typeof cover === "number") {
    return undefined;
  }

  const display = cover.sizes?.display;

  if (
    display?.url &&
    display.width &&
    display.width > 0 &&
    display.height &&
    display.height > 0
  ) {
    return {
      src: display.url,
      alt: cover.alt,
      width: display.width,
      height: display.height,
    };
  }

  if (
    cover.url &&
    cover.width &&
    cover.width > 0 &&
    cover.height &&
    cover.height > 0
  ) {
    return {
      src: cover.url,
      alt: cover.alt,
      width: cover.width,
      height: cover.height,
    };
  }

  return undefined;
}

export function mapGameDocumentToGameDetail(
  game: PayloadGameDocument,
): GameDetail {
  const mediaCover = resolvePayloadMediaCover(game.cover);

  return {
    slug: game.slug,
    title: game.title,
    originalTitle: game.originalTitle ?? undefined,
    developer: game.developer,
    releaseDate: game.releaseDate,
    status: game.playStatus,
    summary: game.summary,
    body: game.body as DefaultTypedEditorState,
    cover: mediaCover ?? {
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
