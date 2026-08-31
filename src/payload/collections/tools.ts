import type { CollectionConfig } from "payload";

import { isAuthenticated } from "../access/is-authenticated";
import {
  validateHttpUrl,
  validateRequiredText,
  validateRequiredTextarea,
} from "../fields/validators";

export const Tools: CollectionConfig = {
  slug: "tools",
  admin: {
    defaultColumns: ["title", "category", "sortOrder", "updatedAt"],
    useAsTitle: "title",
  },
  access: {
    create: isAuthenticated,
    delete: isAuthenticated,
    read: () => true,
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
      name: "description",
      type: "textarea",
      required: true,
      validate: validateRequiredTextarea,
    },
    {
      name: "url",
      type: "text",
      required: true,
      validate: validateHttpUrl,
    },
    {
      name: "category",
      type: "select",
      defaultValue: "database",
      options: [
        { label: "Text Hooking", value: "text-hooking" },
        { label: "Runtime", value: "runtime" },
        { label: "Database", value: "database" },
        { label: "Capture", value: "capture" },
      ],
      required: true,
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 100,
      required: true,
    },
  ],
};
