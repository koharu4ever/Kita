import type { CollectionConfig } from "payload";

import { isAuthenticated } from "../access/is-authenticated";
import { contentEditor } from "../fields/content-editor";
import {
  validateHttpUrl,
  validateRequiredText,
  validateRequiredTextarea,
  validateSlug,
} from "../fields/validators";

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
    create: isAuthenticated,
    delete: isAuthenticated,
    read: ({ req }) =>
      req.user
        ? true
        : {
            publicationStatus: {
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
      name: "originalTitle",
      type: "text",
    },
    {
      name: "developer",
      type: "text",
      required: true,
      validate: validateRequiredText,
    },
    {
      name: "releaseDate",
      type: "text",
      required: true,
      validate: validateRequiredText,
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
      validate: validateRequiredTextarea,
    },
    {
      name: "body",
      type: "richText",
      editor: contentEditor,
      required: true,
    },
    {
      name: "cover",
      type: "upload",
      admin: {
        description: "Required Payload Media cover.",
      },
      relationTo: "media",
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
          validate: validateRequiredText,
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
          validate: validateRequiredText,
        },
        {
          name: "href",
          type: "text",
          required: true,
          validate: validateHttpUrl,
        },
      ],
    },
  ],
};
