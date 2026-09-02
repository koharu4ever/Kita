import type { DefaultTypedEditorState } from "@payloadcms/richtext-lexical";

export type ReviewPreview = {
  slug: string;
  title: string;
  gameTitle: string;
  date: string;
  excerpt: string;
  coverImage: string;
  rating: number;
  readingTime: string;
  tags: string[];
  body: DefaultTypedEditorState;
  updatedAt: string;
};

export type ReviewNavigationItem = Pick<
  ReviewPreview,
  "date" | "slug" | "title"
>;

export type ReviewNavigation = {
  next?: ReviewNavigationItem;
  previous?: ReviewNavigationItem;
};
