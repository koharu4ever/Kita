import type { CollectionConfig } from "payload";
import {
  BlockquoteFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";

import { gameCoverOptions } from "@/features/games/data/game-cover-assets";

export const Games: CollectionConfig = {
  slug: "games",
  admin: {
    defaultColumns: [
      "title",
      "developer",
      "playStatus",
      "publicationStatus",
      "updatedAt",
    ],
    useAsTitle: "title",
  },
  access: {
    read: ({ req }) =>
      req.user
        ? true
        : {
            publicationStatus: {
              equals: "published",
            },
          },
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "originalTitle",
      type: "text",
    },
    {
      name: "developer",
      type: "text",
      required: true,
    },
    {
      name: "releaseDate",
      type: "text",
      required: true,
    },
    {
      name: "playStatus",
      type: "select",
      defaultValue: "planned",
      options: [
        { label: "Finished", value: "finished" },
        { label: "Playing", value: "playing" },
        { label: "Planned", value: "planned" },
      ],
      required: true,
    },
    {
      name: "publicationStatus",
      type: "select",
      defaultValue: "draft",
      index: true,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      required: true,
    },
    {
      name: "summary",
      type: "textarea",
      required: true,
    },
    {
      name: "body",
      type: "richText",
      editor: lexicalEditor({
        features: () => [
          ParagraphFeature(),
          HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
          BoldFeature(),
          ItalicFeature(),
          UnorderedListFeature(),
          OrderedListFeature(),
          BlockquoteFeature(),
          LinkFeature(),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
      required: true,
    },
    {
      name: "coverKey",
      type: "select",
      options: [...gameCoverOptions],
      required: true,
    },
    {
      name: "tags",
      type: "array",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "links",
      type: "array",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "href",
          type: "text",
          required: true,
        },
      ],
    },
  ],
};
