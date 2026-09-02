import path from "path";
import type { CollectionConfig } from "payload";

import { isAuthenticated } from "../access/is-authenticated";
import { validateRequiredText } from "../fields/validators";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: isAuthenticated,
    delete: isAuthenticated,
    read: () => true,
    update: isAuthenticated,
  },
  admin: {
    description:
      "公开图片库，供 Game 封面和 Reviews/Games 正文复用。删除前请手动检查所有引用；目前没有自动阻止删除使用中图片的保护。",
    defaultColumns: ["filename", "alt", "mimeType", "updatedAt"],
    useAsTitle: "filename",
  },
  disableDuplicate: true,
  fields: [
    {
      name: "alt",
      type: "text",
      admin: {
        description:
          "Describe the visible image content for screen readers and loading failures.",
      },
      maxLength: 240,
      minLength: 3,
      required: true,
      validate: validateRequiredText,
    },
  ],
  upload: {
    adminThumbnail: "thumbnail",
    bulkUpload: false,
    crop: false,
    displayPreview: true,
    filesRequiredOnCreate: true,
    focalPoint: false,
    imageSizes: [
      {
        formatOptions: {
          format: "webp",
          options: { quality: 82 },
        },
        name: "thumbnail",
        width: 400,
        withoutEnlargement: true,
      },
      {
        formatOptions: {
          format: "webp",
          options: { quality: 84 },
        },
        name: "display",
        width: 1600,
        withoutEnlargement: true,
      },
    ],
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    pasteURL: false,
    staticDir: path.resolve(process.cwd(), ".payload-media"),
  },
};
