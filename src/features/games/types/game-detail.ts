import type { DefaultTypedEditorState } from "@payloadcms/richtext-lexical";

export type GameStatus = "finished" | "playing" | "planned";

export type GameDetail = {
  slug: string;
  title: string;
  originalTitle?: string;
  developer: string;
  releaseDate: string;
  status: GameStatus;
  summary: string;
  body: DefaultTypedEditorState;
  cover: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  tags: string[];
  links: Array<{
    href: string;
    label: string;
  }>;
};
