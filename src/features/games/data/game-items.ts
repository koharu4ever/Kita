import type {
  DefaultNodeTypes,
  DefaultTypedEditorState,
} from "@payloadcms/richtext-lexical";
import { buildEditorState } from "@payloadcms/richtext-lexical";

import { resolveGameCover } from "@/features/games/data/game-cover-assets";
import type { GameDetail } from "@/features/games/types/game-detail";

export function createGameBody(paragraphs: string[]): DefaultTypedEditorState {
  const [firstParagraph, ...remainingParagraphs] = paragraphs;
  const remainingNodes = remainingParagraphs.flatMap(
    (paragraph) =>
      buildEditorState<DefaultNodeTypes>({ text: paragraph }).root.children,
  );

  return buildEditorState<DefaultNodeTypes>({
    nodes: remainingNodes,
    text: firstParagraph,
  });
}

export const gameItems: GameDetail[] = [
  {
    slug: "sea-side-fragment",
    title: "Sea Side Fragment",
    originalTitle: "海辺の断章",
    developer: "Placeholder Studio",
    releaseDate: "2024",
    status: "playing",
    summary:
      "A quiet summer story about letters, tide pools, and the fragments people leave behind when they move on.",
    body: createGameBody([
      "A short archive entry for checking the most compact version of the detail page.",
    ]),
    cover: resolveGameCover("sea-side-fragment"),
    tags: ["Summer", "Drama", "Memory"],
    links: [{ href: "https://vndb.org/", label: "VNDB placeholder" }],
  },
  {
    slug: "night-archive",
    title: "Night Archive",
    originalTitle: "夜のアーカイブ",
    developer: "Kita Works",
    releaseDate: "2023",
    status: "finished",
    summary:
      "An atmospheric mystery built around a city observatory, missing recordings, and an old promise under the sky.",
    body: createGameBody([
      "The observatory, missing recordings, and slow nighttime dialogue give this entry enough atmosphere without turning it into a full review.",
      "A future database record can replace this text while the page continues to consume the same GameDetail contract.",
    ]),
    cover: resolveGameCover("night-archive"),
    tags: ["Mystery", "Atmosphere", "Night"],
    links: [{ href: "https://vndb.org/", label: "VNDB placeholder" }],
  },
  {
    slug: "after-rain",
    title: "After Rain",
    originalTitle: "雨上がりの窓",
    developer: "Rain Window",
    releaseDate: "2022",
    status: "planned",
    summary:
      "A small urban visual novel about waiting rooms, glass reflections, and a harbor that changes after rain.",
    body: createGameBody([
      "The image ratio is intentionally taller to test the masonry layout against varied covers.",
      "This second paragraph checks the spacing between a short summary, body copy, tags, and external links.",
    ]),
    cover: resolveGameCover("after-rain"),
    tags: ["Urban", "Rain", "Reflection"],
    links: [{ href: "https://vndb.org/", label: "VNDB placeholder" }],
  },
  {
    slug: "sunset-field",
    title: "Sunset Field",
    originalTitle: "夕焼けの野原",
    developer: "Orange Hour",
    releaseDate: "2021",
    status: "finished",
    summary:
      "A nostalgic slice-of-life story where the last train, the school field, and a late confession share one orange hour.",
    body: createGameBody([
      "This entry keeps the calm visual tone that already exists in Kita's public image set.",
    ]),
    cover: resolveGameCover("sunset-field"),
    tags: ["Slice of Life", "Ending", "Nostalgia"],
    links: [{ href: "https://vndb.org/", label: "VNDB placeholder" }],
  },
  {
    slug: "crimson-room",
    title: "Crimson Room",
    originalTitle: "赤い部屋の栞",
    developer: "Old Bookmark",
    releaseDate: "2020",
    status: "planned",
    summary:
      "A compact chamber mystery placeholder for testing detail-page metadata, tags, and external links.",
    body: createGameBody([
      "The red interior works as a contrast test for denser archive notes and longer metadata.",
    ]),
    cover: resolveGameCover("crimson-room"),
    tags: ["Mystery", "Room", "Classic"],
    links: [{ href: "https://vndb.org/", label: "VNDB placeholder" }],
  },
  {
    slug: "harbor-loop",
    title: "Harbor Loop",
    originalTitle: "港のループ",
    developer: "Loop Script",
    releaseDate: "2019",
    status: "playing",
    summary:
      "A route-loop structure placeholder for checking how longer summaries sit beside the large hero image.",
    body: createGameBody([
      "This longer body tests how the page behaves when an archive entry needs more than one compact note.",
      "The first section can describe the premise without repeating a full review. A second section can record why the game matters, which route was completed, or which edition was used.",
      "Because the body is Rich Text, headings, emphasis, lists, quotations, and links can be introduced later without adding dedicated database columns for every possible section.",
      "The page remains an archive rather than a review: metadata stays structured, while the personal part stays flexible.",
    ]),
    cover: resolveGameCover("harbor-loop"),
    tags: ["Loop", "Harbor", "Route"],
    links: [{ href: "https://vndb.org/", label: "VNDB placeholder" }],
  },
];

export function getGameBySlug(slug: string) {
  return gameItems.find((game) => game.slug === slug);
}
