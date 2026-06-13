import type { CollectionConfig } from "payload";

export const Tools: CollectionConfig = {
  slug: "tools",
  admin: {
    defaultColumns: ["title", "category", "sortOrder", "updatedAt"],
    useAsTitle: "title",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      required: true,
    },
    {
      name: "url",
      type: "text",
      required: true,
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
