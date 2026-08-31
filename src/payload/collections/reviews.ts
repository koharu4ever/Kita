import type { CollectionConfig } from "payload";

import { isAuthenticated } from "../access/is-authenticated";
import { contentEditor } from "../fields/content-editor";
import {
  validateRequiredText,
  validateRequiredTextarea,
  validateSlug,
} from "../fields/validators";

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
    create: isAuthenticated,
    delete: isAuthenticated,
    read: ({ req }) =>
      req.user
        ? true
        : {
            status: {
              equals: "published",
            },
          },
    update: isAuthenticated,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      validate: validateRequiredText,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      validate: validateSlug,
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
      validate: validateRequiredText,
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
      validate: validateRequiredTextarea,
    },
    {
      name: "coverImage",
      type: "text",
      required: true,
      validate: validateRequiredText,
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
      validate: validateRequiredText,
    },
    {
      name: "tags",
      type: "array",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          validate: validateRequiredText,
        },
      ],
    },
    {
      name: "body",
      type: "richText",
      editor: contentEditor,
      required: true,
    },
  ],
};
