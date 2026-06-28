import type { CollectionConfig } from "payload";

export const Reviews: CollectionConfig = {
  slug: "reviews",
  admin: {
    defaultColumns: [
      "title",
      "gameTitle",
      "status",
      "publishedAt",
      "rating",
      "updatedAt",
    ],
    useAsTitle: "title",
  },
  access: {
    read: ({ req }) =>
      req.user
        ? true
        : {
            status: {
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
      name: "status",
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
      name: "gameTitle",
      type: "text",
      required: true,
    },
    {
      name: "publishedAt",
      type: "date",
      required: true,
    },
    {
      name: "excerpt",
      type: "textarea",
      required: true,
    },
    {
      name: "coverImage",
      type: "text",
      required: true,
    },
    {
      name: "rating",
      type: "number",
      max: 10,
      min: 0,
      required: true,
    },
    {
      name: "readingTime",
      type: "text",
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
      name: "body",
      type: "array",
      fields: [
        {
          name: "paragraph",
          type: "textarea",
          required: true,
        },
      ],
    },
  ],
};
