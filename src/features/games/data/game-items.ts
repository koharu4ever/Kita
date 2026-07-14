import type {
  DefaultNodeTypes,
  DefaultTypedEditorState,
} from "@payloadcms/richtext-lexical";
import { buildEditorState } from "@payloadcms/richtext-lexical";

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
    slug: "white-album-2",
    title: "WHITE ALBUM2",
    originalTitle: "ホワイトアルバム2",
    developer: "Leaf / AQUAPLUS / STING",
    releaseDate: "2010-03-26",
    status: "planned",
    summary:
      "A long-form winter romance in which music, timing, and an earnest love triangle bind three people together before pulling them apart.",
    body: createGameBody([
      "The story begins with three separate sounds meeting at school: guitar, piano, and a voice from the rooftop. That brief harmony becomes the emotional center of a relationship shaped by late autumn, winter snow, and choices that arrive too late.",
      "This local entry is intentionally compact. It tests the real cover ratio and the new asset-path data flow without turning the game archive into a second review section.",
    ]),
    cover: {
      src: "/games/covers/white-album-2-v2.jpg",
      alt: "WHITE ALBUM2 cover featuring two heroines in a snowy street",
      width: 1920,
      height: 1200,
    },
    tags: ["Romance", "Drama", "Winter", "Musical Themes"],
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
  },
];

export function getGameBySlug(slug: string) {
  return gameItems.find((game) => game.slug === slug);
}
